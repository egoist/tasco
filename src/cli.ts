#!/usr/bin/env node
import { parse, Option } from "tinyargs"
import * as colors from "colorette"
import { version } from "../package.json"
import { helpTable } from "./utils"

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
    {
      name: "ifPresent",
      flags: ["if-present"],
      type: Boolean,
    },
    {
      name: "waitOnOutput",
      flags: ["wait-on-output"],
      type: String,
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
    await run(cli.script, {
      filter: cli.filter,
      forwardArgs: cli._,
      ifPresent: cli.ifPresent,
      waitOnOutput: cli.waitOnOutput,
    })
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

${helpTable([
  [
    `  -f, --filter <filter>`,
    [
      `Filter packages in current workspace, supports glob patterns, can be multiple`,
      `The filter is matched against package name, rather than directory name`,
      ``,
      `Examples:`,
      `  --filter @scope/*`,
      `  --filter my-package --filter @scope/*`,
    ],
  ],
  [
    `  --if-present`,
    [
      `Only run the script if it exists`,
      `without this flag tasco will throw an error if the script does not exist`,
    ],
  ],
  [
    `  --wait-on-output <string>`,
    [
      `Wait for the command output to contain the string to execute the next script`,
      `useful for development with a watcher`,
      ``,
      `Examples:`,
      `  --wait-on-output "built successfully"`,
    ],
  ],
])}

`

main()
