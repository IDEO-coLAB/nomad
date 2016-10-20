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

module.exports = {
  debug: R.isNil(process.env.DEBUG) ? false : Boolean(process.env.DEBUG),
  isAtomic: checkAtomicity(),
}
