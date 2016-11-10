const R = require('ramda')

const log = require('./utils/log')

const MODULE_NAME = 'MESSAGE_CACHE'

const MAX_MESSAGE_STORE_SIZE = 5

// Note: this is currently an in-process-memory cache

// Class for a node to work with its subscription messages store
//
class MessageStore {
  constructor() {
    this.store = {}
  }

  // Get a message from the store for a key, or return the mosr recent
  //
  // @param {String} key (optional <b58_hash>)
  //
  // @return {Array} messages for the key || {Object} MessageStore
  //
  get(key) {
    const keyPassed = !R.isNil(key)
    const keyExists = R.has(key, this.store)

    if (keyPassed) {
      if (keyExists) {
        return this.store[key]
      }
      return []
    }

    return this.store
  }

  // Update the store with new messages
  //
  // @param {String} key
  // @param {Object} message
  // @param {string} link (hash to look up the message on the network)
  //
  // @return {Object} MessageStore
  //
  put(key, message, link) {
    log.info(`${MODULE_NAME}: ${key}: Adding new message`)

    const keyExists = R.has(key, this.store)
    if (!keyExists) {
      this.store[key] = []
    }

    const subscriptionStore = this.store[key]
    if (R.length(subscriptionStore) >= MAX_MESSAGE_STORE_SIZE) {
      // remove the last message from end
      subscriptionStore.pop()
    }

    // add the latest message to the front
    subscriptionStore.unshift({
      link,
      message,
    })

    log.info(`${MODULE_NAME}: ${key}: Message added`)
    return subscriptionStore
  }
}

// API
//
module.exports = new MessageStore()
