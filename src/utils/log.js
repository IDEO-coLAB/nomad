'use strict'

const winston = require('winston')
const constants = require('./constants')

const logger = new winston.Logger({
  transports: [ new winston.transports.Console({ colorize: true }) ]
})

const logWithOptions = (level, data) => {
  if (!constants.DEBUG) return
  logger[level](data || null)
}

const log = (...data) => {
  return logWithOptions('info', data)
}

const logWarn = (...data) => {
  return logWithOptions('warn', data)
}

const logError = (...data) => {
  return logWithOptions('error', data)
}

module.exports = { log, logWarn, logError }
