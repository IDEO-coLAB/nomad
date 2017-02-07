/**
 * Queue of messages. Iteratively calls handler until queue is empty. Handler
 * is promise returning. No more than one call to handler happens at a time.
 */

 const PQueue = require('p-queue')

 const log = require('../utils/log')

 const MODULE_NAME = 'HEADER_WAREHOUSE'

 // Currently assuming that this doesn't need to be persisted to disk, only needs to be in memory
 // TODO: should we be using Maps. What about browser compatability?

 class MessageHeaderWarehouse {
  /**
   * @param {function} new message handler. Handler takes arguments (publisher id, hash, message) and returns
   * a promise that resolves when the message has been delivered to the users callback.
   */
  constructor (subscription) {
    this.handler = subscription.processMessageHeader.bind(subscription)
    this.queue = new PQueue({ concurrency: 1 })
  }

  addMessageHeader (header) {
    log.info(`${MODULE_NAME}: Adding ${header.multihash} to the warehouse queue`)

    this.queue.add(() => {
      // Note: handler needs to be promise returning
      return this.handler(header)
    })
  }
}

module.exports = MessageHeaderWarehouse
