'use strict'

const ipfsApi = require('ipfs-api')
const R = require('ramda')
const Q = require('q')
const async = require('async')
const config = require('./../nomad.config')
const { sync, publish } = require('./publish')
// const subscribe = require('./subscribe')
const { log } = require('./utils/log')
const env = require('./utils/env')
const ipfsUtils = require('./utils/ipfs')

const MODULE_NAME = 'SENSOR'

module.exports = class Node {
  constructor () {
    // TODO: check for a config in the bootup?
    this.atomic = env.isAtomic
    this.config = config
    this.identity = null
    this.network = { connected: false }


    this.current = { node: null, path: null }
    this.subscriptions = {}
    this.store = {}
  }

  connect () {
    const connectAtomic = () => {
      log(`${MODULE_NAME}: < BOOTING UP ATOMIC SENSOR >`)

      return sync(this)
    }

    const connectComposite = () => {
      log(`${MODULE_NAME}: < BOOTING UP COMPOSITE SENSOR >`)

      return sync(this)
        // .then(subscribe.sync)
    }

    return ipfsUtils.id()
      .then((identity) => {
        log(`${MODULE_NAME}: Connected to IPFS peers with ID: ${identity.ID}`)

        this.identity = identity
        this.network.connected = true

        return this.atomic ? connectAtomic() : connectComposite()
      })
  }

  publish (data) {
    return publish(data, this)
  }
}
