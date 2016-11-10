const fs = require('fs')
const R = require('ramda')

const Subscription = require('./subscription')
const { publish, publishRoot } = require('./publish')
const { getHead } = require('./node-cache')
const log = require('./utils/log')
const { id } = require('./utils/ipfs')
const { passOrDie, NomadError } = require('./utils/errors')

const MODULE_NAME = 'NODE'

// Class: Node
//
// @param {Object} userConfig (Array of peerIds)
//
module.exports = class Node {
  constructor(userConfig = []) {
    this.identity = null

    // TODO: tidy this bit up
    const hydratedUserConfig = R.map((sub) => {
      return { sub: null }
    }, userConfig)

    this.subscriptions = R.mapObjIndexed((sub, subId) => {
      const newSub = new Subscription(subId)
      // newSub.start()
      return newSub
    }, hydratedUserConfig)

    this.head = getHead()
  }

  // Connect the sensor to the network and set the node's identity
  //
  // @return {Promise} Node
  //
  prepareToPublish() {
    log.info(`${MODULE_NAME}: Connecting sensor to the network`)

    // TODO: tidy this up into an connection-status checker fn
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
