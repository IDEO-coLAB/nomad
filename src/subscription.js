const log = require('./utils/log')
const { getHeadForStream, setHeadForStream } = require('./local-state')

/**
 * TODO:
 * -
 */

const MODULE_NAME = 'SUBSCRIBE'

/**
 * Class: Subscription
 */
module.exports = class Subscription {
  /**
   * Constructor
   *
   * @param {String} id
   * @param {Object} ipfs
   * @returns {Subscription}
   */
  constructor(id, ipfs) {
    this.id = id
    this._ipfs = ipfs
  }
}
