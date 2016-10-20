const fs = require('fs')
const path = require('path')
const R = require('ramda')

const NomadError = require('./errors')

let userConfigJSON

(function importUserConfig() {
  try {
    const buffer = fs.readFileSync(path.resolve(__dirname, './../../nomad.json'))
    userConfigJSON = JSON.parse(buffer.toString())
  } catch (err) {
    throw new NomadError(err.message)
  }
}())

const isAtomic = (function checkAtomicity() {
  const subscriptions = userConfigJSON.subscriptions
  if (R.isNil(subscriptions)) return true
  if (!R.isArrayLike(subscriptions)) return true
  if (R.isArrayLike(subscriptions) && R.isEmpty(subscriptions)) return true
  return false
}())

const debug = R.equals(typeof process.env.DEBUG, 'boolean') ? Boolean(process.env.DEBUG) : false

const subscriptions = isAtomic ? [] : userConfigJSON.subscriptions

module.exports = {
  debug,
  isAtomic,
  subscriptions,
}
