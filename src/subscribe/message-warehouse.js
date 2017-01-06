/**
 * Queue of messages. Iteratively calls handler until queue is empty. Handler
 * is promise returning. No more than one call to handler happens at a time.
 */

 const PQueue = require('p-queue')

 // Currently assuming that this doesn't need to be persisted to disk, only needs to be in memory
 // TODO: should we be using Maps. What about browser compatability?

 class MessageWarehouse {
  /**
   * @param {function} new message handler. Handler takes arguments (hash, message) and returns 
   * a promise that resolves when the message has been delivered to the users callback.
   */
  constructor (handler) {
    this.handler = handler
    this.queue = new PQueue({concurrency: 1})
  }

  addMessage(hash, message) {
    this.queue.add(() => {
      this.handler(hash, message)
    })
  }
}