const R = require('ramda')

const log = require('./utils/log')
// const NomadError = require('./utils/errors')

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
  // @return {Array} messages for the key || {Object} the entire message store
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
  // @param {Array} messages (list of message objects)
  //  {
  //    source: <b58_hash>,     // IPNS subscription hash
  //    message: <some_data>
  //  }
  //
  // @return {Obj} Store object
  //
  put(messages) {
    log.info(`${MODULE_NAME}: Adding ${R.length(messages)} new messages to the message store`)

    R.forEach((msg) => {
      const keyExists = R.has(msg.source, this.store)

      if (!keyExists) {
        this.store[msg.source] = { messages: [] }
      }

      const subStore = this.store[msg.source]
      if (R.length(subStore.messages) >= MAX_MESSAGE_STORE_SIZE) {
        // remove from end
        subStore.messages.pop()
      }
      // add to the front
      subStore.messages.unshift(msg.message)
    }, messages)

    return messages
  }
}

// API
//
module.exports = new MessageStore()
