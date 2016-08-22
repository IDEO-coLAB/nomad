'use strict'

const R = require('ramda')
const config = require('./../../nomad.config')

module.exports.isAtomic = function checkAtomicity() {
  const subs = config.subscriptions
  if (!subs) return true
  if (!R.isArrayLike(subs)) throw new Error('Config subscriptions must be an <Array>')
  if (R.isEmpty(subs)) return true
  return false
}()

module.exports.DEBUG = true
