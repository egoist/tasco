#!/usr/bin/env node
'use strict'
const meow = require('meow')
const update = require('update-notifier')
const main = require('./lib')

const cli = meow(`
  Usage:
    tasco [taskName]

  Example:
    tasco js
    tasco css
    taskco build # js/css/html

  Options:
    --watch, -w         Watch mode
    --config-file, -c   Specific config file
    --verbose, -V       Show more logs
    --help, -h          Output help (You are here!)
    --version, -v       Output version

  More usages: https://github.com/egoist/tasco#api
`, {
  alias: {
    w: 'watch',
    c: 'config-file',
    V: 'verbose',
    v: 'version',
    h: 'help'
  }
})

update({pkg: cli.pkg}).notify()

const options = cli.flags
options.task = cli.input[0]

if (!options.task || options.task.length === 0) {
  cli.showHelp()
  process.exit()
}

main(options)
