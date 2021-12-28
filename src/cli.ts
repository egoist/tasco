#!/usr/bin/env node
import { parse, Option } from "tinyargs"
import * as colors from "colorette"
import { version } from "../package.json"

async function main() {
  const options: Option<unknown>[] = [
    {
      name: "version",
      flags: ["v"],
      type: Boolean,
      stop: true,
    },
    {
      name: "filter",
      flags: ["f"],
      type: String,
      multiple: true,
    },
    { name: "command", positional: true, type: String, optionalValue: true },
    {
      name: "script",
      positional: true,
      type: String,
      optionalValue: true,
      stop: true,
      when: (cli) => cli.command === "run",
    },
    {
      name: "commandName",
      positional: true,
      type: String,
      optionalValue: true,
      stop: true,
      when: (cli) => cli.command === "help",
    },
  ]
  const cli = parse(process.argv.slice(2), options)

  if (cli.version) {
    console.log(version)
    return
  }

  if (cli.command === "run") {
    const { run } = await import("./run")
    await run(cli.script, { filter: cli.filter, forwardArgs: cli._ })
  } else if (cli.command === "help") {
    if (cli.commandName === "run") {
      console.log(RunCommandHelp)
    } else {
      console.log(RootCommandHelp)
    }
  } else {
    console.log(RootCommandHelp)
  }
}

const RootCommandHelp = `
Usage: 

  $ tasco [...tasco_flags] [command] 

Commands:
  run [script_name] [...forward_args]    Run npm script
  help [command_name]                    Show help for a command

Flags:
  -v, --version                          Display version
`

const RunCommandHelp = `
Usage:

  $ tasco run [...tasco_flags] [script] [...forward_args]

Flags:
  ${colors.bold(
    `-f, --filter <filter>`
  )}   Filter packages in current workspace, supports glob patterns, can be multiple
                          The filter is matched against package name, rather than directory name

                          Examples:
                            --filter @scope/*
                            --filter **ui**
                            --filter my-package --filter @scope/*
`

main()
