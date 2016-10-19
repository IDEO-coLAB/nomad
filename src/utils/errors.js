'use strict'

class NomadError extends Error {
  constructor (message) {
    super()
    Error.captureStackTrace(this, this.constructor)
    this.name = `NomadError`
    this.message = `${message}`
  }
}

module.exports = NomadError
