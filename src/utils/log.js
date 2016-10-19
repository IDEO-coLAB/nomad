'use strict'

const debug = require('debug')

const log = debug('nomad')
log.warn = debug('nomad:warn')
log.err = debug('nomad:error')
log.info = debug('nomad:info')
log.verbose = debug('nomad:verbose')
log.debug = debug('nomad:debug')

module.exports = log
