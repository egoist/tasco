'use strict'
const path = require('path')

const _ = module.exports = {}

_.assign = (left, right) => {
  if (typeof left !== 'undefined') {
    return left
  }
  return left || right
}

_.cwd = function () {
  const args = [].slice.call(arguments)
  return path.join.apply(path, [process.cwd()].concat(args))
}

_.replaceExt = (name, ext) => {
  if (!ext) {
    return name
  }
  return path.join(
    path.dirname(name),
    `${path.basename(name, path.extname(name))}${ext}`
  )
}
