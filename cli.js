#!/usr/bin/env node
'use strict'
const meow = require('meow')
const main = require('./lib')

const cli = meow(`
  Usage:
    tasco [taskName]

  Example:
    tasco js
    tasco css
    taskco build # js/css/html
`, {
  alias: {
    w: 'watch',
    c: 'config-file',
    V: 'verbose'
  }
})

const options = cli.flags
options.task = cli.input[0]
main(options)
