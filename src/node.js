const fs = require('fs')
const R = require('ramda')
const path = require('path')

const ipfs = require('./utils/ipfs')


// TODO: STILL BEING PORTED OVER
const { publish } = require('./old-publish')
const { getHead } = require('./node-cache')
const Subscription = require('./old-subscription')
const log = require('./utils/log')
const { passOrDie, NomadError } = require('./utils/errors')

const MODULE_NAME = 'NODE'

// TODO: define what we want here...
const DEFAULT_CONFIG = {
  repo: `${path.resolve(__dirname)}/TESTER-ipfs-nomad-repo`,
  ipfs: { emptyRepo: true, bits: 2048 }
}

// Class: Node
//
// @param {Object} config
//
module.exports = class Node {
  constructor(config = DEFAULT_CONFIG) {
    this.config = config
    // this.identity = null
    // this.subscriptions = null
    // this.head = getHead()
  }

  // Start the node and connect it to the network
  //
  // @return {Promise}
  //
  start() {
    const self = this
    return ipfs.init(self.config)
      .then(ipfs.load)
      .then(ipfs.goOnline)
      .then(ipfs.id)
      .then((id) => self.identity = id)
  }

  stop() {
    return ipfs.goOffline()
  }

  // Check if the node is connected to the network
  //
  // @return {Bool}
  //
  isOnline() {
    return ipfs.isOnline()
  }

  // Publish data
  //
  // @param {Object} data
  //
  // @return {Promise} Node
  //
  publish(data) {
    log.info(`${MODULE_NAME}: Publishing`)

    let dataBuf = data
    if (Buffer.isBuffer(dataBuf)) {
      dataString = new Buffer(dataBuf)
    }
    return publish(dataBuf, this)
  }
}
