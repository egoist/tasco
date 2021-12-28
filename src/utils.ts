import path from "path"
import * as colors from "colorette"

export const formatScriptLog = (
  pkg: { name: string; dir: string },
  text: string
) => {
  let prefix = ""
  prefix += `${colors.cyan(pkg.name)} `
  const relativeDir = path.relative(process.cwd(), pkg.dir)
  prefix += `${relativeDir ? colors.dim(`${relativeDir} `) : ""}`
  return colors.bold(
    `${colors.bold(prefix)}${colors.magenta("$")} ${colors.dim(text)}`
  )
}

export const arraify = <T>(value: T | T[]): T[] =>
  Array.isArray(value) ? value : [value]
