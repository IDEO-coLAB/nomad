const R = require('ramda')

const log = require('./log')

// Class: Nomad error
//
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

// Class: Daemon offline error
//
class IPFSErrorDaemonOffline extends NomadError {
  constructor() {
    super('IPFS daemon offline')
  }
}

// Errors considered fatal; these are used to determine if the error
// should kill the process
const fatalErrors = [IPFSErrorDaemonOffline]

// Determine if an error is an instance of, what we've determined
// to be, fatal errors
//
// @param {Object} err
//
// @return {Bool}
//
const instanceOfFatalErrors = (err) => {
  const matchedErrors = R.find(errorClass => err instanceof errorClass, fatalErrors)
  return !R.isNil(matchedErrors)
}

// Handle 'fatal' errors or pass them along
//
// @param {Object} err
//
// @return {Promise} nomad error object
//
const passOrDie = (moduleName) => {
  return (err) => {
    if (err instanceof NomadError) {
      log.err(`${moduleName}: ${err.toErrorString()}`)
    } else {
      log.err(`${moduleName}: ${err}`)
    }

    if (instanceOfFatalErrors(err)) {
      log.err(`${moduleName}: fatal error`)
      log.err(`${moduleName}: exiting`)
      process.exit(1)
    }
    return Promise.reject(err)
  }
}

module.exports = {
  NomadError,
  IPFSErrorDaemonOffline,
  passOrDie,
}
