const R = require('ramda')

const log = require('./utils/log')
const { getHeadForStream, setHeadForStream } = require('./local-state')

/**
 * TODO:
 * -
 */

const MODULE_NAME = 'SUBSCRIPTIONS'

module.exports = exports

let subscriptions = new Map()

exports.subscribe = (ipfs) => {
  const format = (id, handler) => {
    return (data) => {
      // TODO: time to start defining the protocol at this layer...
      handler(data)
    }
  }

  return (id, handler) => {
    ipfsHandler = format(id, handler)
    subscriptions.set(id, ipfsHandler)
    ipfs.pubsub.subscribe(id, ipfsHandler)
  }
}

exports.unsubscribe = (ipfs) => {
  return (id) => {
    const ipfsHandler = subscriptions.get(id)
    ipfs.pubsub.unsubscribe(id, ipfsHandler)
    subscriptions.delete(id)
  }
}
