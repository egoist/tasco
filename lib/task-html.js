'use strict'
const path = require('path')
const pug = require('pug')
const dotProp = require('dot-prop')
const pkg = require('../package')
const fs = require('./fs')
const stderr = require('./stderr')
const _ = require('./utils')

module.exports = config => {
  const prop = keyPath => dotProp.get(config, keyPath)

  const htmlEntry = _.assign(prop('html.entry'), prop('entry'))
  const htmlDest = _.assign(prop('html.dest'), prop('dest'))

  stderr(htmlEntry, 'Expected the entry file for task HTML.')
  stderr(htmlDest, 'Expected the dest directory for task HTML.')

  const rename = _.assign(prop('html.rename'), prop('rename'))
  const entry = path.join(
    process.cwd(),
    htmlEntry
  )
  const dest = path.join(
    process.cwd(),
    htmlDest,
    _.replaceExt(rename || path.basename(entry), '.html')
  )

  const data = Object.assign({
    time: Date.now(),
    pkg
  }, _.assign(prop('html.data'), prop('data')))

  const pretty = !(_.assign(prop('html.compress'), prop('compress')))

  return fs.readFile(entry, 'utf8')
    .then(str => {
      const html = pug.compile(str, {pretty})(data)
      return fs.writeFile(dest, html, 'utf8')
    })
}
