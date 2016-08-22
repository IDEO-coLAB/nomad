'use strict'

module.exports.NODE_DEFAULT_ROOT = {
  message: 'Hello from Nomad!',
  timestamp: new Date().toString()
}

module.exports.DEBUG = true

module.exports.NAME_RESOLVE_THROTTLES = [15000, 20000, 45000, 60000]
