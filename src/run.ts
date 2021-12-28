import path from "path"
import { execaCommand } from "execa"
import glob from "fast-glob"
import globRegex from "glob-regex"
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
}) => {
  const { pkg, scriptName, allPackages, forwardArgs, ifPresent, alreadyRun } =
    opts

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
    await execaCommand(args.join(" "), {
      stdio: "inherit",
      cwd: pkg.dir,
      preferLocal: true,
      shell: true,
    })
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
  }: { filter?: string | string[]; forwardArgs?: string[]; ifPresent?: boolean }
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
    })
  }
}
