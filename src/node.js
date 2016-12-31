const R = require('ramda')
const path = require('path')
const IPFS = require('ipfs')

const promisifyIPFS = require('./utils/promisify-ipfs')
const log = require('./utils/log')
const publish = require('./publish')
const subscriptions = require('./subscriptions')

const MODULE_NAME = 'NODE'

/**
 * TODO:
 * - Better define config passing and init options
 * - Better / unified error handling within and across modules
 */

const DEFAULT_CONFIG = {
  repo: `${path.resolve(__dirname)}/TESTER-ipfs-nomad-repo`,
  ipfs: { emptyRepo: true, bits: 2048 }
}

/**
 * Class: Node
 */
module.exports = class Node {
  /**
   * Node Constructor
   *
   * @param {Object} config
   * @returns {Node}
   */
  constructor (config = DEFAULT_CONFIG) {
    this._ipfsConfig = config
    this._ipfs = promisifyIPFS(new IPFS(this._ipfsConfig.repo))

    this._publish = publish(this._ipfs)
    this._subscribe = subscriptions.subscribe(this._ipfs)
    this._unsubscribe = subscriptions.unsubscribe(this._ipfs)

    this.identity = null
    this.subscriptions = new Map()
  }

  /**
   * Bring the node online
   *
   * @returns {Promise} resolves with the node's identity
   */
  start () {
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
  stop () {
    log.info(`${MODULE_NAME}: Stopping`)
    return this._ipfs.goOfflineP()
  }

  /**
   * Check if the node is online
   *
   * @returns {Bool}
   */
  isOnline () {
    return this._ipfs.isOnline()
  }

  /**
   * Publish data for the node
   *
   * @param {Buffer|String|Obj} data
   * @returns {Promise} resolves with the newly published head's hash
   */
  publish (data) {
    log.info(`${MODULE_NAME}: Publishing`)

    if (R.isNil(data)) {
      throw new Error('Publish requires a data argument')
    }
    return this._publish(this.identity.id, data)
  }

  /**
   * Subscribe a handler be triggered when new events come in from a list of ids
   *
   * @param {Array} ids
   * @param {Function} handler
   */
  subscribe (ids, handler) {
    log.info(`${MODULE_NAME}: Subscribing`)

    // ids not passed
    if (R.isNil(ids) || typeof ids === 'function' || !R.isArrayLike(ids)) {
      throw new Error(`'ids' must be an array`)
    }
    // ids empty
    if (R.isEmpty(ids)) {
      throw new Error(`'ids' must contain at least one id`)
    }
    // handler is not a function
    if (typeof handler !== 'function') {
      throw new Error(`'handler' must be a function`)
    }

    ids.filter((id) => !this.subscriptions.has(id))
      .forEach((id) => {
        this._subscribe(id, handler)
        this.subscriptions.set(id, handler)
      })
  }

  /**
   * Unsubscribe from an id
   *
   * @param {String} id
   * @param {Function} handler
   */
  unsubscribe (id) {
    this._unsubscribe(id)
    this.subscriptions.delete(id)
  }
}
