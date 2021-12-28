import path from "path"
import { execaCommand } from "execa"
import glob from "fast-glob"
import globRegex from "glob-regex"
import * as colors from "colorette"
import stripAnsi from "strip-ansi"
import { arraify, formatScriptLog } from "./utils"
import { joycon } from "./config-loader"
import { listScripts } from "./list"

type NotFoundErrorProps = {
  type: "PkgNotFound"
  dir: string
}

type ErrorProps = NotFoundErrorProps

class TascoError extends Error {
  props?: ErrorProps
  constructor(message: string, props?: ErrorProps) {
    super(message)
    this.name = "TascoError"
    this.props = props
  }
}

type PkgManifest = {
  name: string
  version?: string
  scripts?: Record<string, string>
  dependencies?: Record<string, string>
  devDependencies?: Record<string, string>
  peerDependencies?: Record<string, string>
}

export type Pkg = {
  dir: string
  manifest: PkgManifest
}

const readPkg = async (dir: string): Promise<Pkg> => {
  const pkg = await joycon.load(["package.json"], dir)
  if (!pkg.path)
    throw new TascoError(`No package.json found in ${dir}`, {
      type: "PkgNotFound",
      dir,
    })
  if (!pkg.data.name) {
    throw new TascoError(`Missing "name" in ${pkg.path}`)
  }
  return { dir: path.dirname(pkg.path), manifest: pkg.data }
}

const getDependentPackages = ({
  manifest,
  allPackages,
}: {
  manifest: PkgManifest
  allPackages: Pkg[]
}) => {
  const deps = {
    ...manifest.dependencies,
    ...manifest.devDependencies,
    ...manifest.peerDependencies,
  }
  const names: string[] = []
  for (const pkg of allPackages) {
    if (pkg.manifest.name in deps) {
      names.push(pkg.manifest.name)
    }
  }
  return allPackages.filter(
    (p) => p.manifest.name && names.includes(p.manifest.name)
  )
}

const runScript = async (opts: {
  pkg: Pkg
  scriptName: string
  allPackages: Pkg[]
  forwardArgs?: string[]
  /**
   * Only run the script if the script is present, otherwise throw an error.
   */
  ifPresent?: boolean
  alreadyRun: Set<string>
  waitOnOutput?: string
}) => {
  const {
    pkg,
    scriptName,
    allPackages,
    forwardArgs,
    ifPresent,
    alreadyRun,
    waitOnOutput,
  } = opts

  if (alreadyRun.has(pkg.manifest.name)) return
  alreadyRun.add(pkg.manifest.name)

  const scriptContent = pkg.manifest.scripts && pkg.manifest.scripts[scriptName]

  if (scriptContent) {
    const dependentPackages = getDependentPackages({
      manifest: pkg.manifest,
      allPackages,
    })
    for (const dPkg of dependentPackages) {
      await runScript({
        ...opts,
        alreadyRun,
        pkg: dPkg,
        ifPresent: true,
      })
    }
    const args = [scriptContent, ...(forwardArgs || [])]
    console.log(
      formatScriptLog(
        { dir: pkg.dir, name: pkg.manifest.name },
        scriptName + ": " + args.join(" ")
      )
    )
    const cmd = execaCommand(args.join(" "), {
      stdio: "pipe",
      cwd: pkg.dir,
      preferLocal: true,
      shell: true,
      env: {
        FORCE_COLOR: process.env.FORCE_COLOR === "0" ? undefined : "1",
      },
    })

    let waitOnOutputPromise: Promise<void> | void
    let resolveWaitOnOutput = () => {}

    if (waitOnOutput) {
      waitOnOutputPromise = new Promise((resolve) => {
        resolveWaitOnOutput = resolve
      })
    }

    const outputData = (data: any, type: "stdout" | "stderr") => {
      const stream = type === "stderr" ? process.stderr : process.stdout
      stream.write(colors.cyan(colors.bold(pkg.manifest.name)) + " ")
      stream.write(data)

      if (waitOnOutput && stripAnsi(data.toString()).includes(waitOnOutput)) {
        resolveWaitOnOutput()
      }
    }

    cmd.stdout!.on("data", (data) => {
      outputData(data, "stdout")
    })

    cmd.stderr!.on("data", (data) => {
      outputData(data, "stderr")
    })

    await Promise.all([
      waitOnOutputPromise,
      scriptName !== "dev" && (await cmd),
    ])
  } else {
    if (!ifPresent) {
      throw new TascoError(`No script named ${scriptName} in ${pkg.dir}`)
    }
  }
}

const getAllPackages = async (): Promise<Pkg[]> => {
  const config = await joycon.load({
    files: ["pnpm-workspace.yaml", "package.json"],
    packageKey: "workspaces",
  })
  if (!config.path) return []

  const rootDir = path.dirname(config.path)
  const packages = config.path.endsWith("pnpm-workspace.yaml")
    ? config.data?.packages
    : config.data
  if (!packages) {
    return []
  }

  return glob(packages, {
    onlyDirectories: true,
    absolute: true,
    cwd: rootDir,
  }).then((dirs) =>
    Promise.all(
      dirs.map(async (dir) => {
        const pkg = await readPkg(dir)
        return pkg
      })
    )
  )
}

export const run = async (
  scriptName: string | undefined,
  {
    filter,
    forwardArgs,
    ifPresent,
    waitOnOutput,
  }: {
    filter?: string | string[]
    forwardArgs?: string[]
    ifPresent?: boolean
    waitOnOutput?: string
  }
) => {
  const allPackages = await getAllPackages()

  let packagesToRun: Pkg[] = []

  if (filter) {
    const RE = arraify(filter).map((f) => globRegex(f))
    packagesToRun = allPackages.filter((p) => {
      return RE.some((re) => re.test(p.manifest.name))
    })
  } else {
    const pkg = await readPkg(".")
    packagesToRun = [pkg]
  }

  if (!scriptName) {
    listScripts(packagesToRun)
    return
  }

  const alreadyRun: Set<string> = new Set()

  for (const pkg of packagesToRun) {
    await runScript({
      pkg,
      scriptName,
      allPackages,
      forwardArgs,
      ifPresent,
      alreadyRun,
      waitOnOutput,
    })
  }
}
