const winston = require('winston')

const debugMode = true

const logger = new winston.Logger({
  transports: [ new winston.transports.Console({ colorize: true }) ]
})

module.exports = (msg, data) => {
  if (!debugMode) return
  data = data || null
  logger.info(msg, data)
}
