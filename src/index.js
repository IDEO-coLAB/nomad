const ipfsApi = require('ipfs-api')
const R = require('ramda')
const Q = require('q')
const async = require('async')

const config = require('./../nomad.config')
const log = require('./log')
const pub = require('./publish')
const sub = require('./subscribe')
const utils = require('./utils')

const ipfs = ipfsApi()


const atomic = function checkAtomicity() {
  const subs = config.subscriptions
  if (!subs) return true
  if (!R.isArrayLike(subs)) throw new Error('Config subscriptions must be an <Array>')
  if (R.isEmpty(subs)) return true
  return false
}()


module.exports = class Node {
  constructor () {
    // TODO: check for a config in the bootup?
    this.atomic = atomic
    this.config = config
    this.identity = null
    this.connected = null
    this.currentDAG = { data: null, path: null }
    this.subscriptions = { connected: [], disconnected: [] }
  }

  connect () {
    const connectAtomic = () => {
      log('< BOOTING UP ATOMIC SENSOR >')
      return pub.sync(this)
    }

    const connectComposite = () => {
      log('< BOOTING UP COMPOSITE SENSOR >')
      return pub.sync(this)
        .then(sub.sync)
    }

    return ipfs.id()
      .then((identity) => {
        log('Connected to IPFS peers with ID:', identity.ID)
        this.identity = identity
        this.connected = true

        return this.atomic ? connectAtomic() : connectComposite()
      })
  }

  publish (data) {
    return pub.publish(data, this)
  }
}
