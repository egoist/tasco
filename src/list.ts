import * as colors from "colorette"
import { Pkg } from "./run"

export const listScripts = (packages: Pkg[]) => {
  for (const pkg of packages) {
    if (pkg.manifest.scripts) {
      console.log(colors.cyan(colors.bold(`${pkg.manifest.name}`)))
      for (const name in pkg.manifest.scripts) {
        console.log(colors.bold(`  ${name}`))
        console.log(colors.dim(`    ${pkg.manifest.scripts[name]}`))
      }
    }
  }
}
