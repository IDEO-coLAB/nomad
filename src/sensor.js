'use strict'

const ipfsApi = require('ipfs-api')
const R = require('ramda')
const Q = require('q')
const async = require('async')
const config = require('./../nomad.config')
const { syncHead, publish } = require('./publish')
// const { syncSubs } = require('./subscribe')
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

    this.head = { DAG: null, path: null }

    this.subscriptions = {}
    this.store = {}
  }

  connect () {
    log(`${MODULE_NAME}: Connecting sensor to the network`)

    const connectAtomic = () => {
      log(`${MODULE_NAME}: Connecting an atomic sensor`)
      return syncHead(this)
    }

    const connectComposite = () => {
      log(`${MODULE_NAME}: Connecting a composite sensor`)
      return syncHead(this)
        // .then(subscribe.sync)
    }

    return ipfsUtils.id()
      .then((identity) => {
        log(`${MODULE_NAME}: IPFS daemon is running with ID: ${identity.ID}`)

        this.identity = identity
        this.network.connected = true

        return this.atomic ? connectAtomic() : connectComposite()
      })
  }

  publish (data, opts={}) {
    log(`${MODULE_NAME}: Publishing latest data`)
    return publish(data, this, opts)
  }
}
