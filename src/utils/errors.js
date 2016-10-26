class NomadError extends Error {
  constructor(message) {
    super()
    Error.captureStackTrace(this, this.constructor)
    this.message = `${message}`
  }

  toErrorString() {
    return `${this.constructor.name}: ${this.message}\n${this.stack}`
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
