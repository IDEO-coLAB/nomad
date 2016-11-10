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
  constructor(userConfig = {}) {
    this.identity = null
    this.subscriptions = null
    this.head = getHead()
  }

  // Connect the sensor to the network and set the node's identity
  //
  // @return {Promise} Node
  //
  prepareToPublish() {
    log.info(`${MODULE_NAME}: Connecting sensor to the network`)

    // TODO: tidy this up into an connection-status checker fn
    // since it gives the node an identity, I think it is ok to wrap it in
    return id()
      .then((identity) => {
        this.identity = identity
        log.info(`${MODULE_NAME}: IPFS daemon is running with ID: ${identity.ID}`)
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

  // Add new subscription(s) to the node, attach an event handler
  // and start polling for each new subscription
  //
  // @param {Array || String} subscriptionIds ([peerId, peerId, ...] or peerId)
  // @param {Func} cb
  //
  subscribe(subscriptionIds, cb) {
    if (typeof cb !== 'function') {
      throw new NomadError('Callback must be a function')
    }

    let newSubscriptions = subscriptionIds
    if (typeof newSubscriptions === 'string') {
      newSubscriptions = [newSubscriptions]
    }
    // TODO: More sanity checking (e.g. for b58 strings)

    let nodeSubscriptions = Object.assign({}, this.subscriptions)

    R.forEach((subId) => {
      if (!R.has(subId, nodeSubscriptions)) {
        log.info(`${MODULE_NAME}: ${subId}: New subscription handler registered`)
        const newSub = new Subscription(subId)
        newSub.addHandler(cb)
        newSub.start()
        nodeSubscriptions[subId] = newSub
      }
    }, newSubscriptions)

    // Set the new subscriptions on the node
    this.subscriptions = nodeSubscriptions
  }

  // Remove a subscription from the node
  //
  // @param {String} subscriptionId (peerId)
  //
  unsubscribe(subscriptionId) {

  }
}
