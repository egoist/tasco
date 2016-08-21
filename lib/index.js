'use strict'
const path = require('path')
const merge = require('lodash.merge')
const dotProp = require('dot-prop')
const prettyHrtime = require('pretty-hrtime')
const chokidar = require('chokidar')
const chalk = require('chalk')
const tasks = require('./tasks')
const getConfig = require('./get-config')
const log = require('./log')

module.exports = function (options) {
  options = options || {}

  const configFile = options.configFile || 'tasco.json'
  const config = merge(
    getConfig(configFile),
    options,
    {configFile}
  )

  const prop = keyPath => dotProp.get(config, keyPath)

  if (prop('verbose')) {
    console.log(JSON.stringify(config, null, 2))
  }

  const init = {}
  const watch = prop('watch')

  const run = name => {
    const start = process.hrtime()
    log.info(`building ${name}`)
    return tasks[name](config)
      .then(() => {
        const end = process.hrtime(start)
        log.info(`done ${name} ${chalk.grey(`(${prettyHrtime(end)})`)}`)

        if (watch && !init[name]) {
          if (prop('verbose')) {
            log.info(`watching ${name} files for you`)
          }
          init[name] = true
          const watchSource = prop(`${name}.watch`) || path.dirname(prop(`${name}.entry`))
          chokidar.watch(watchSource, {ignored: 'node_modules/*'})
            .on('change', file => {
              log.info(file, 'updated')
              run(name)
            })
        }
      })
      .catch(err => {
        log.error(`tasco ran into an error:`, name)
        console.log(err.stack)
        if (!watch) {
          process.exit(err.code || 1)
        }
      })
  }

  const task = options.task

  if (task === 'build') {
    const buildTasks = prop('build') || ['html', 'css', 'js']
    Promise.all(buildTasks.map(name => run(name)))
  } else if (typeof tasks[task] === 'function') {
    run(task)
  }
}
