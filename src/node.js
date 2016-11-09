const fs = require('fs')
const R = require('ramda')
// const taskQueue = require('task-queue')

const Subscription = require('./subscription')
// const { getLatest } = require('./subscribe')
// const messageStore = require('./message-store')

const { publish, publishRoot } = require('./publish')
const log = require('./utils/log')
const config = require('./utils/config')
const { id } = require('./utils/ipfs')
const { passOrDie, NomadError } = require('./utils/errors')

const MODULE_NAME = 'NODE'

const NODE_HEAD_PATH = config.path.nodeHead

// Class: Node
//
// @param: [PEER IDs]
module.exports = class Node {
  constructor(userConfig = []) {
    if (!R.isArrayLike(userConfig)) { throw new NomadError('Nomad node constructor must be called without an argument or with an array of subscription IDs') }

    this.isOnline = false
    this.identity = null

    const hydratedUserConfig = R.map((sub) => {
      return { sub: null }
    }, userConfig)

    this.subscriptions = R.mapObjIndexed((sub, subId) => {
      const newSub = new Subscription(subId)
      newSub.start()
      return newSub
    }, hydratedUserConfig)

    // Try setting the node head from disk
    this.head = null
    try {
      // TODO: create file if it does not exist
      const buffer = fs.readFileSync(NODE_HEAD_PATH)
      this.head = JSON.parse(buffer.toString())
      log.info(`${MODULE_NAME}: Set node head from disk`)
    } catch (err) {
      log.info(`${MODULE_NAME}: No existing node head on disk`)
    }
  }

  // Connect the sensor to the network and set the node's identity
  //
  // @return {Promise} Node
  //
  prepareToPublish() {
    log.info(`${MODULE_NAME}: Connecting sensor to the network`)

    return id()
      .then((identity) => {
        log.info(`${MODULE_NAME}: IPFS daemon is running with ID: ${identity.ID}`)
        this.identity = identity
        this.isOnline = true
        return this
      })
      .catch(passOrDie(MODULE_NAME))
  }

  // Publish data to the network
  //
  // @param {Object} data
  //
  // @return {Promise} Node
  //
  publish(data) {
    log.info(`${MODULE_NAME}: Publishing new data`)
    return publish(data, this)
      .catch(passOrDie(MODULE_NAME))
  }

  // Publish the node's data root to the network
  //
  // @param {Object} data
  //
  // @return {Promise} Node
  //
  publishRoot(data) {
    log.info(`${MODULE_NAME}: Publishing new root`)
    return publishRoot(data, this)
      .catch(passOrDie(MODULE_NAME))
  }

  // Add a user-defined function to handle new message arrivals for subscriptions
  //
  // @param {Func} cb
  //
  onMessage(cb) {
    log.info(`${MODULE_NAME}: Registering handlers for ${R.length(R.keys(this.subscriptions))} subscriptions`)

    // possibly return list of remove functions
    R.values((sub) => {
      sub.addHandler(cb)
    }, this.subscriptions)
  }
}
