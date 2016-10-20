const R = require('ramda')

const NomadError = require('./errors')
const userConfig = require('./../../nomad')

const verifyUserConfig = function verifyUserConfig() {
  if (R.isNil(userConfig)) throw new NomadError('missing nomad.config file')
}

function checkAtomicity() {
  const subscriptions = userConfig.subscriptions
  if (!subscriptions) return true
  if (R.isEmpty(subscriptions)) return true
  return false
}

verifyUserConfig()

const isAtomic = checkAtomicity()

const debug = R.exists(process.env.DEBUG) ? Boolean(process.env.DEBUG) : false

module.exports = { debug, isAtomic }
