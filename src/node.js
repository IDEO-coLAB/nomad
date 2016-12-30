const fs = require('fs')
const R = require('ramda')
const path = require('path')

const ipfs = require('./utils/ipfs')
const log = require('./utils/log')
const { publish } = require('./publish')

const MODULE_NAME = 'NODE'

/**
 * TODO:
 * - Better define config passing and init options
 */

const DEFAULT_CONFIG = {
  repo: `${path.resolve(__dirname)}/TESTER-ipfs-nomad-repo`,
  ipfs: { emptyRepo: true, bits: 2048 }
}

/**
 * Node Class
 */
module.exports = class Node {
  /**
   * Node Constructor
   *
   * @param {Object} config
   * @returns {Node}
   */
  constructor(config = DEFAULT_CONFIG) {
    this.config = config
    this.identity = null
  }

  /**
   * Give the node an identity and bring it online
   *
   * @returns {Promise} resolves with the node's identity
   */
  start() {
    log.info(`${MODULE_NAME}: Starting`)
    const self = this

    return ipfs.init(self.config)
      .then(ipfs.load)
      .then(ipfs.goOnline)
      .then(ipfs.id)
      .then((id) => {
        self.identity = id
        return self
      })
  }

  /**
   * Bring the node online
   *
   * @returns {Promise} resolves with the node's identity
   */
  stop() {
    log.info(`${MODULE_NAME}: Stopping`)
    return ipfs.goOffline()
  }

  /**
   * Check if the node is online
   *
   * @returns {Bool}
   */
  isOnline() {
    return ipfs.isOnline()
  }

  /**
   * Publish data for the node
   *
   * @param {Buffer|String|Obj} data
   * @returns {Promise} resolves with the newly published head's hash
   */
  publish(data) {
    log.info(`${MODULE_NAME}: Publishing`)

    if (R.isNil(data)) {
      throw new Error('Publish requires a data argument')
    }
    return publish(this.identity.id, data)
  }
}
