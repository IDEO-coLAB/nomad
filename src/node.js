const R = require('ramda')
const path = require('path')
const IPFS = require('ipfs')

const promisifyIPFS = require('./utils/promisify-ipfs')
const log = require('./utils/log')
const publish = require('./publish')

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
    this._ipfsConfig = config
    this._ipfs = promisifyIPFS(new IPFS(this._ipfsConfig.repo))
    this._publish = publish(this._ipfs)

    this.identity = null
  }

  /**
   * Bring the node online
   *
   * @returns {Promise} resolves with the node's identity
   */
  start() {
    log.info(`${MODULE_NAME}: Starting`)

    return this._ipfs.initP(this._ipfsConfig.ipfs)
      .then(this._loadP)
      .then(this._ipfs.goOnlineP)
      .then(this._ipfs.id)
      .then((id) => {
        this.identity = id
        return this
      })
  }

  /**
   * Take the node offline
   *
   * @returns {Promise} resolves with the node's identity
   */
  stop() {
    log.info(`${MODULE_NAME}: Stopping`)
    return this._ipfs.goOfflineP()
  }

  /**
   * Check if the node is online
   *
   * @returns {Bool}
   */
  isOnline() {
    return this._ipfs.isOnline()
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
    return this._publish(this.identity.id, data)
  }
}
