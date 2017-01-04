const R = require('ramda')

const log = require('./utils/log')
// const { getHeadForStream, setHeadForStream } = require('./local-state')

/**
 * TODO:
 * - Start defining the receive protocols and formatting at this layer
 */

const MODULE_NAME = 'SUBSCRIPTIONS'

module.exports = exports

let subscriptions = new Map()

exports.subscribe = (self) => {
  /**
   * Handler function called each time a new message is received from the network
   *
   * @param {String} id
   * @param {Object} handler
   * @returns {Function}
   */
  const receive = (id, handler) => {
    return (msg) => {
      // We use an array for delivery to avoid iterating by insertion order
      // which happens by default in ES6 Sets
      let deliveryQueue = new Array()

      // The locally cached head
      const localHead = self.heads.getHeadForStream(id)
      // The new head incoming from the network
      const newHead = msg.data.toString()

      /**
       * Set up a new delivery queue
       *
       */
      const resetDeliveryQueue = () => deliveryQueue = new Array()

      /**
       * Execute a pre-defined function to deliver a formatted message
       *
       * @param {Object} hash
       */
      const deliverMessage = (hash) => {
        self.heads.setHeadForStream(id, hash)
        handler({ from: id, data: hash })
      }

      /**
       * Deliver messages from the queue, then reset the queue
       *
       */
      const deliverMessages = () => {
        deliveryQueue.forEach((msg) => deliverMessage(msg))
        resetDeliveryQueue()
      }

      /**
       *
       *
       * @param {String} hash
       */
      const confirmHashOnNetwork = (hash) => {
        // Add hash to the deliveryQueue
        deliveryQueue.unshift(hash)

        return self._ipfs.object.get(hash, { enc: 'base58' })
          .then((DAG) => {
            const head = DAG.toJSON()
            const prevArry = head.links.filter((l) => l.name === 'prev')
            const networkPrev = prevArry.length && prevArry[0].multihash
            const localPrev = self.heads.getHeadForStream(id)

            // - If there is no 'prev' link in this object, we reached a new root
            // - If 'prev' link matches the cached head, we are up to date, and
            //   and can start devliering
            if (R.isEmpty(prevArry) || (networkPrev === localPrev)) {
              return deliverMessages()
            }

            // If 'prev' link doesn't match the cached head,
            // walk back and check the previous head
            return confirmHashOnNetwork(networkPrev)
          })
      }

      // If there is no cached head, deliver the incoming message
      if (R.isNil(localHead)) {
        deliveryQueue.unshift(newHead)
        return deliverMessages()
      }

      // Otherwise ensure that the new head's 'prev' matches the network's version
      confirmHashOnNetwork(newHead)
    }
  }


  return (id, handler) => {
    const ipfsHandler = receive(id, handler)
    subscriptions.set(id, ipfsHandler)
    self._ipfs.pubsub.subscribe(id, ipfsHandler)
  }
}

exports.unsubscribe = (self) => {
  return (id) => {
    const ipfsHandler = subscriptions.get(id)
    self._ipfs.pubsub.unsubscribe(id, ipfsHandler)
    subscriptions.delete(id)
  }
}
