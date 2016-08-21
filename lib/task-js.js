'use strict'
const path = require('path')
const rollup = require('rollup').rollup
const dotProp = require('dot-prop')
const stderr = require('./stderr')
const _ = require('./utils')

module.exports = config => {
  const prop = keyPath => dotProp.get(config, keyPath)

  const jsEntry = _.assign(prop('js.entry'), prop('entry'))
  const jsDest = _.assign(prop('js.dest'), prop('dest'))

  stderr(jsEntry, 'Expected the entry file for task JS.')
  stderr(jsDest, 'Expected the dest directory for task JS.')

  const rename = _.assign(prop('js.rename'), prop('rename'))
  const entry = path.join(
    process.cwd(),
    jsEntry
  )
  const dest = path.join(
    process.cwd(),
    jsDest,
    rename || path.basename(entry)
  )


  const cjs = _.assign(prop('js.cjs'), prop('cjs'))
  const umd = _.assign(prop('js.umd'), prop('umd'))

  let moduleName
  let format
  if (umd) {
    format = 'umd'
    if (typeof umd !== 'string') {
      throw new Error('Expected property umd to be a string')
    }
    moduleName = umd
  } else if (cjs) {
    format = 'cjs'
  } else {
    format = 'iife'
    moduleName = _.assign(prop('js.moduleName'), prop('moduleName'))
    moduleName = moduleName || `tasco${Math.random().toString(36).substring(2,5)}`
  }

  const map = _.assign(prop('js.map'), prop('map'))

  const plugins = []
  const buble = _.assign(prop('js.buble'), prop('buble'))
  const compress = _.assign(prop('js.compress'), prop('compress'))

  if (buble) {
    plugins.push(
      require('rollup-plugin-buble')()
    )
  } else {
    plugins.push(
      require('rollup-plugin-babel')({
        presets: [
          [
            require.resolve('babel-preset-es2015'),
            {modules: false}
          ],
          require.resolve('babel-preset-stage-1')
        ]
      })
    )
  }

  if (compress) {
    plugins.push(
      require('rollup-plugin-uglify')
    )
  }

  return rollup({
    entry: entry,
    plugins
  }).then(bundle => {
    return bundle.write({
      dest,
      format,
      moduleName,
      sourceMap: map
    })
  })
}
