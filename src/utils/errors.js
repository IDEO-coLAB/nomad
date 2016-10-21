const log = require('./log')

class NomadError extends Error {
  constructor(message) {
    super()
    Error.captureStackTrace(this, this.constructor)
    this.message = `${message}`
  }

  toErrorString() {
  	return `${this.constructor.name}: ${this.message}`
  }
}

class IPFSErrorDaemonOffline extends NomadError {
  constructor() {
    super('IPFS daemon offline')
  }
}

module.exports = {
  NomadError,
  IPFSErrorDaemonOffline,
}
