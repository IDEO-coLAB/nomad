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
    return (msg) => {
      // The new head hash incoming from the network
      const newHeadHash = msg.data.toString()

      log.info(`${MODULE_NAME}: ${id} published ${newHeadHash}`)

      // // The local state's current knowledge of the node's head
      // let cachedHead

      // We might have to walk back to deliver missed messages
      // this queue is how we track messages to deliver in-order
      let deliveryQueue = new Array()

      /**
       * Call the user's callback with a formatted message and update the head
       *
       * @param {Object} DAGNode
       */
      const deliverMessage = (DAGNode) => {
        const hash = DAGNode.multihash

        self.heads.setHeadForStream(id, DAGNode)
          .then((newCachedHead) => {
            deliveredMessages.add(hash)
            handler({ from: id, data: hash })
            log.info(`${MODULE_NAME}: Delivered ${hash} from ${id}`)
          })
          .catch((err) => {
            // TODO: how do we want to propagate errors
            console.log('deliverMessage error:', err)
          })
      }

      /**
       * Deliver anything in the delivery queue that has not been delivered
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
       * @param {String} hash
       */
      const deliverMessagesUpToIncluding = (hash) => {
        // If the hash has been delivered already, no more network lookups
        // are necessary - drain the queue
        if (deliveredMessages.exists(hash)) {
          return deliverMessages()
        }

        let networkHead

        // return Promise.all([
        //   self.heads.getHeadForStream(id),
        // ])



        self._ipfs.object.get(hash, { enc: 'base58' })
          .then((DAG) => {
            networkHead = DAG.toJSON()
            return self.heads.getHeadForStream(id)
          })
          .then((cachedHead) => {
            const networkPrev = networkHead.links.filter((l) => l.name === 'prev')
            const networkPrevHash = !R.isEmpty(networkPrev) ? networkPrev[0].multihash : null
            const localPrevHash = !R.isNil(cachedHead) ? cachedHead.multihash : null

            // Add the head to the delivery queue
            addToQueue(networkHead)

            // - If there is no 'prev' link in the network head, we reached a new root
            // - If network head's 'prev' link matches the cached version,
            //   we are up to date, and and can start devliering
            if (R.isNil(networkPrevHash) || R.isNil(cachedHead)){
              console.log('REACHED NEW ROOT', hash)
              return deliverMessages()
            }

            if (networkPrevHash === localPrevHash) {
              console.log('NETWORK PREV MATCHED LOCAL', networkPrevHash)
              return deliverMessages()
            }

            // If the network's 'prev' link doesn't match the cached version,
            // walk back to the previous node and recursively check it
            deliverMessagesUpToIncluding(networkPrevHash)
          })
      }






      self.heads.getHeadForStream(id)
        .then((currentDAG) => {
          if (currentDAG) {
            return deliverMessagesUpToIncluding(currentDAG.multihash)
          }
          addToQueue(networkHead)
          return deliverMessages()
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
    const ipfsHandler = subscriptions.get(hash)
    self._ipfs.pubsub.unsubscribe(hash, ipfsHandler)
    subscriptions.delete(hash)

    log.info(`${MODULE_NAME}: ${self.identity.id} unsubscribed from ${hash}`)
  }
}