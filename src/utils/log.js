const debug = require('debug')

// TODO: have both nomad and ipfs loggers so that we
// can turn off the ipfs loggers in production
const log = debug('nomad')
log.warn = debug('nomad:warn')
log.err = debug('nomad:error')
log.info = debug('nomad:info')
log.verbose = debug('nomad:verbose')
log.debug = debug('nomad:debug')
log.test = debug('nomad:test')

module.exports = log
