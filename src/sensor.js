'use strict'

const ipfsApi = require('ipfs-api')
const R = require('ramda')
const Q = require('q')
const async = require('async')
const config = require('./../nomad.config')
const { syncHead, publish, publishRoot } = require('./publish')
const { getNewSubscriptionMessages } = require('./subscribe')
const { log } = require('./utils/log')
const { isAtomic } = require('./utils/constants')
const { id } = require('./utils/ipfs')
const taskQueue = require('task-queue')

const MODULE_NAME = 'SENSOR'
const POLL_MILLIS = 1000 * 10

module.exports = class Node {
  constructor () {
    // TODO: check for a config in the bootup?
    this.atomic = isAtomic
    this.config = config
    this.identity = null
    this.network = { connected: false }
    this.tasks = taskQueue.Queue({capacity: 5, concurrency: 1})
    this.tasks.start()

    this.head = { DAG: null, path: null }

    this.subscriptions = {}
    this.store = {}
  }

  prepareToPublish () {
    log(`${MODULE_NAME}: Connecting sensor to the network`)

    const connectAtomic = () => {
      log(`${MODULE_NAME}: Connecting an atomic sensor`)
      return syncHead(this)
    }

    const connectComposite = () => {
      log(`${MODULE_NAME}: Connecting a composite sensor`)
      return syncHead(this)
        // .then(syncSubscriptions)
    }

    return id()
      .then((identity) => {
        log(`${MODULE_NAME}: IPFS daemon is running with ID: ${identity.ID}`)

        this.identity = identity
        this.network.connected = true

        return this.atomic ? connectAtomic() : connectComposite()
      })
  }

  publish (data) {
    log(`${MODULE_NAME}: Publishing new data`)
    return publish(data, this)
  }

  publishRoot (data) {
    log(`${MODULE_NAME}: Publishing new root`)
    return publishRoot(data, this)
  }

  // does this need to return anything since we're using callbacks?
  subscribe (cb) {
    log(`${MODULE_NAME}: Subscribing to ${R.length(config.subscriptions)} subscriptions`)
    getNewSubscriptionMessages(config.subscriptions, cb)
    this.subscribePollHandle = setInterval(() => {
      if (this.tasks.size() < 1) {
        // only poll if the previous poll finished, otherwise wait until next pass
        // through
        this.tasks.enqueue(getNewSubscriptionMessages, {args: [config.subscriptions, cb]})
      } else {
        log(`skipping poll because task queue has length ${this.tasks.size()}`)
      }
    }, POLL_MILLIS)
  }
}
