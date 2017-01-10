const R = require('ramda')
const log = require('../utils/log')
const Subscription = require('./subscription')

/**
 * Presents interface for adding, removing subscriptions,
 * tracks map of existing subscriptions.
 * - Error handling on subscribe receive fails...
 */

const MODULE_NAME = 'SUBSCRIPTIONS'

class SubscriptionsManager {
  constructor(node) {
    this.node = node
    // Keeps track of all existing subscriptions for the Node
    // Map values are instances of Subscription
    this.subscriptions = new Map()
  }

  /**
   * Exposed subscribe API
   *
   * @param {id} peer ID of the subscription
   * @param {handler} callback to fire when new messages arrive
   */
  subscribe(id, handler) {
    const subscription  = new Subscription(id, this.node._ipfs, this.node.heads, handler)
    subscription.start()
    this.subscriptions.set(id, subscription)
  }

  /**
   * Exposed unsubscribe API
   *
   * @param {id} peer ID of the subscription
   */
  unsubscribe(id) {
    const subscription = this.subscriptions.get(id)
    subscription.end()
    this.subscriptions.delete(id)
  }
}

module.exports = SubscriptionsManager
