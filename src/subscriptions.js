const R = require('ramda')
const { BloomFilter } = require('bloom-filter-js')

const log = require('./utils/log')

/**
 * TODO:
 * - Error handling on subscribe receive fails...
 * - Start defining the receive protocols and formatting at this layer
 * - Move subscriptions into the state / cache layer
 * - Move the delivered messages bloom filter into the state / cache layer
 */

const MODULE_NAME = 'SUBSCRIPTIONS'

module.exports = exports

// Keeps track of all existing subscriptions for the Node
let subscriptions = new Map()

// Used to determine if a message has definitively not been delivered
let deliveredMessages = new BloomFilter()

/**
 * Exposed subscribe API
 *
 * @param {Object} self (Node instance)
 * @returns {Function}
 */
exports.subscribe = (self) => {
  /**
   * Handler function called each time a new message is received from the network
   *
   * @param {String} id
   * @param {Function} handler
   * @returns {Function}
   */
  const receive = (id, handler) => {
    log.info(`${MODULE_NAME}: Received new data`)

    return (msg) => {
      // The local state's current knowledge of the node's head
      let cachedHead

      // We use an array for delivery to avoid iterating by insertion order
      // which happens by default in ES6 Sets
      let deliveryQueue = new Array()

      // The new head incoming from the network
      const newHead = msg.data.toString()

      /**
       * Execute a pre-defined function to deliver a formatted message
       *
       * @param {Object} DAGNode
       */
      const deliverMessage = (DAGNode) => {
        const hash = DAGNode.multihash
        log.info(`${MODULE_NAME}: Delivering ${hash}`)

        self.heads.setHeadForStream(id, DAGNode)
          .then((newCachedHead) => {
            deliveredMessages.add(hash)
            handler({ from: id, data: hash })
          })
          .catch((err) => {
            // TODO: how do we want to propagate errors
            console.log('deliverMessage error:', err)
          })
      }

      /**
       * Deliver messages from the queue, then reset the queue
       *
       */
      const deliverMessages = () => {
        deliveryQueue.forEach((DAGNode) => {
          if (!deliveredMessages.exists(DAGNode.multihash)) {
            deliverMessage(DAGNode)
          }
        })
      }

      /**
       * Add a DAGNode to the front of the pending delivery queue
       *
       * @param {Object} DAGNode
       */
       const addToQueue = (DAGNode) => deliveryQueue.unshift(DAGNode)

      /**
       *
       *
       * @param {Object} DAGNode
       */
      const confirmHashOnNetwork = (DAGNode) => {
        const hash = DAGNode.multihash
        log.info(`${MODULE_NAME}: Confirming the previous node for ${hash}`)

        // If the hash has been delivered already, no more network lookups
        // are necessary - drain the queue
        if (deliveredMessages.exists(hash)) {
          return deliverMessages()
        }

        // Add the new hash to the delivery queue
        addToQueue(DAGNode)

        self._ipfs.object.get(hash, { enc: 'base58' })
          .then((DAG) => {
            const head = DAG.toJSON()
            const prevArry = head.links.filter((l) => l.name === 'prev')
            const networkPrev = prevArry.length && prevArry[0].multihash
            const localPrev = cachedHead.multihash

            // - If there is no 'prev' link in this object, we reached a new root
            // - If 'prev' link matches the cached head, we are up to date, and
            //   and can start devliering
            if (R.isEmpty(prevArry) || (networkPrev === localPrev)) {
              return deliverMessages()
            }

            // If 'prev' link doesn't match the cached head,
            // walk back and check the previous head
            confirmHashOnNetwork(networkPrev)
          })
      }

      self.heads.getHeadForStream(id)
        .then((headDAG) => {
          // If there is no cached head, deliver the incoming message
          if (R.isNil(headDAG)) {
            addToQueue(headDAG)
            return deliverMessages()
          }

          cachedHead = headDAG
          // Otherwise ensure that the new head's 'prev' matches the network's version
          confirmHashOnNetwork(headDAG)
        })
        .catch((err) => {
          // TODO: how do we want to propagate errors
          console.log('receive error:', err)
        })
    }
  }

  return (id, handler) => {
    const ipfsHandler = receive(id, handler)
    subscriptions.set(id, ipfsHandler)
    self._ipfs.pubsub.subscribe(id, ipfsHandler)
  }
}

/**
 * Exposed unsubscribe API
 *
 * @param {Object} self (Node instance)
 * @returns {Function}
 */
exports.unsubscribe = (self) => {
  return (hash) => {
    log.info(`${MODULE_NAME}: Unsubscribed from ${hash}`)

    const ipfsHandler = subscriptions.get(hash)
    self._ipfs.pubsub.unsubscribe(hash, ipfsHandler)
    subscriptions.delete(hash)
  }
}
