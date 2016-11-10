const fs = require('fs')
const R = require('ramda')

const Subscription = require('./subscription')
const { publish, publishRoot } = require('./publish')
const { getHead } = require('./node-cache')
const log = require('./utils/log')
const config = require('./utils/config')
const { id } = require('./utils/ipfs')
const { passOrDie } = require('./utils/errors')

const MODULE_NAME = 'NODE'

// Class: Node
//
module.exports = class Node {
  constructor() {
    this.identity = null

    this.subscriptions = R.mapObjIndexed((sub, subId) => {
      const newSub = new Subscription(subId)
      // newSub.start()
      return newSub
    }, config.subscriptions)

    this.head = getHead()
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
