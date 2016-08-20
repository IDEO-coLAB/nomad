'use strict'

const ipfsApi = require('ipfs-api')
const R = require('ramda')
const Q = require('q')
const async = require('async')
const config = require('./../nomad.config')
const pub = require('./publish')
const sub = require('./subscribe')
const log = require('./utils/log')
const env = require('./utils/env')

const ipfs = ipfsApi()

module.exports = class Node {
  constructor () {
    // TODO: check for a config in the bootup?
    this.atomic = env.isAtomic
    this.config = config
    this.identity = null
    this.connected = null
    this.currentDAG = { node: null, path: null }
    this.subscriptions = { connected: [], disconnected: [] }
    this.store = {}
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
        log('NODE: Connected to IPFS peers with ID:', identity.ID)
        this.identity = identity
        this.connected = true

        return this.atomic ? connectAtomic() : connectComposite()
      })
  }

  publish (data) {
    return pub.publish(data, this)
  }
}
