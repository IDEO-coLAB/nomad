const R = require('ramda')

// TODO: RENAME THIS TO BE LESS CONFUSING RE: CONFIG
// const config = require('./../nomad')


const { syncHead, publish, publishRoot } = require('./publish')
const { getNewSubscriptionMessages } = require('./subscribe')
const log = require('./utils/log')
const config = require('./utils/config')
const { id } = require('./utils/ipfs')
const taskQueue = require('task-queue')

const MODULE_NAME = 'SENSOR'
const POLL_MILLIS = 1000 * 10

module.exports = class Node {
  constructor() {
    this.isAtomic = config.isAtomic
    this.subscriptions = config.subscriptions

    this.isOnline = false
    this.identity = null

    this.tasks = new taskQueue.Queue({ capacity: 5, concurrency: 1 })
    this.tasks.start()

    this.head = { DAG: null, path: null }

    // TODO: decide what to do here
    // this.store = {}
  }

  prepareToPublish() {
    log.info(`${MODULE_NAME}: Connecting sensor to the network`)

    const connectAtomic = () => {
      log.info(`${MODULE_NAME}: Connecting an atomic sensor`)
      return syncHead(this)
    }

    const connectComposite = () => {
      log.info(`${MODULE_NAME}: Connecting a composite sensor`)
      return syncHead(this)
        // .then(syncSubscriptions)
    }

    return id()
      .then((identity) => {
        log.info(`${MODULE_NAME}: IPFS daemon is running with ID: ${identity.ID}`)

        this.identity = identity
        this.isOnline = true

        return this.isAtomic ? connectAtomic() : connectComposite()
      })
  }

  publish(data) {
    log.info(`${MODULE_NAME}: Publishing new data`)
    return publish(data, this)
  }

  publishRoot(data) {
    log.info(`${MODULE_NAME}: Publishing new root`)
    return publishRoot(data, this)
  }

  // does this need to return anything since we're using callbacks?
  subscribe(cb) {
    log.info(`${MODULE_NAME}: Subscribing to ${R.length(this.subscriptions)} subscriptions`)
    getNewSubscriptionMessages(this.subscriptions, cb)
    this.subscribePollHandle = setInterval(() => {
      if (this.tasks.size() < 1) {
        // only poll if the previous poll finished, otherwise wait until next pass
        // through
        this.tasks.enqueue(getNewSubscriptionMessages, { args: [this.subscriptions, cb] })
      } else {
        log.info(`skipping poll because task queue has length ${this.tasks.size()}`)
      }
    }, POLL_MILLIS)
  }
}
