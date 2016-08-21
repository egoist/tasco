'use strict'
const chalk = require('chalk')

module.exports.info = (msg, name) => {
  name = name || 'tasco'
  console.log(`[${name}] ${msg}`)
}

module.exports.error = (msg, name) => {
  name = name || 'tasco'
  console.log(chalk.red(`[${name}] ${msg}`))
}
