'use strict'
const _ = require('./utils')
const log = require('./log')

module.exports = file => {
  let config = {}
  try {
    config = require(_.cwd(file))
  } catch (err) {
    if (err.code === 'MODULE_NOT_FOUND') {
      log.error(`config file not found: ${file}`)
    } else {
      log.error(err.stack)
    }
    process.exit(1)
  }
  return config
}
