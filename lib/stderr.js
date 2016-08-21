'use strict'
const log = require('./log')

module.exports = (condition, msg) => {
  if (!condition) {
    log.error(msg, 'tasco')
    process.exit(1)
  }
}
