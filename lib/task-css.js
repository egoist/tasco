'use strict'
const path = require('path')
const postcss = require('postcss')
const dotProp = require('dot-prop')
const fs = require('./fs')
const stderr = require('./stderr')
const _ = require('./utils')

module.exports = config => {
  const prop = keyPath => dotProp.get(config, keyPath)

  const cssEntry = _.assign(prop('css.entry'), prop('entry'))
  const cssDest = _.assign(prop('css.dest'), prop('dest'))

  stderr(cssEntry, 'Expected the entry file for task CSS.')
  stderr(cssDest, 'Expected the dest directory for task CSS.')

  const rename = _.assign(prop('css.rename'), prop('rename'))
  const entry = path.join(
    process.cwd(),
    cssEntry
  )
  const dest = path.join(
    process.cwd(),
    cssDest,
    rename || path.basename(entry)
  )

  let map = _.assign(prop('css.map'), prop('map'))
  if (map && map !== 'inline') {
    map = {inline: false}
  }

  // define plugins
  const plugins = [
    require('precss'),
    require('autoprefixer')({
      browsers: _.assign(prop('css.browsers'), prop('browsers'))
    })
  ]

  const compress = _.assign(prop('css.compress'), prop('compress'))
  if (compress) {
    plugins.push(require('cssnano'))
  }

  let parser = null
  if (_.assign(prop('css.sugarss'), prop('sugarss'))) {
    parser = require('sugarss')
  }

  return fs.readFile(entry, 'utf8')
    .then(css => {
      return postcss(plugins)
        .process(css, {
          parser,
          map,
          from: entry,
          to: dest
        })
        .then(result => {
          if (result.map) {
            return Promise.all([
              fs.writeFile(dest, result.css, 'utf8'),
              fs.writeFile(`${dest}.map`, result.map, 'utf8')
            ])
          }
          return fs.writeFile(dest, result.css, 'utf8')
        })
    })
}
