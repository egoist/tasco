import fs from "fs"
import yaml from "js-yaml"
import JoyCon from "joycon"

const joycon = new JoyCon()

joycon.addLoader({
  test: /\.yaml$/,
  loadSync(filepath) {
    return yaml.load(fs.readFileSync(filepath, "utf8"))
  },
})

export { joycon }
