class NomadError extends Error {
  constructor(message) {
    super()
    Error.captureStackTrace(this, this.constructor)
    this.message = `${message}`
  }

  errorString() {
  	return `${this.constructor.name}: ${this.message}`
  }
}

module.exports = NomadError