const R = require('ramda')

const log = require('./utils/log')

const MODULE_NAME = 'MESSAGE_STORE'

const MAX_MESSAGE_STORE_SIZE = 5

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
        return this.store[key].messages
      }
      return []
    }

    return this.store
  }

  // Update the store with new messages
  //
  // @param {String} key
  // @param {Object} message
  //
  // @return {Object} MessageStore
  //
  put(key, message) {
    log.info(`${MODULE_NAME}: Adding new message to the store for ${key}`)

    const keyExists = R.has(key, this.store)
    if (!keyExists) {
      this.store[key] = { messages: [] }
    }

    const subscriptionStore = this.store[key]
    if (R.length(subscriptionStore.messages) >= MAX_MESSAGE_STORE_SIZE) {
      // remove the last message from end
      subscriptionStore.messages.pop()
    }
    // add the latest message to the front
    subscriptionStore.messages.unshift(message)

    return true
  }
}

// API
//
module.exports = new MessageStore()
