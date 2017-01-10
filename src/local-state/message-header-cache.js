const log = require('../utils/log')

/**
 * Caches incoming message headers that have been delivered by the network
 * but have not yet been delivered to the user's callback. If a request
 * isn't in the cache, uses ipfs to fetch it.
 */

// Currently assuming that this doesn't need to be persisted to disk, only needs to be in memory

const MODULE_NAME = 'MSG_HEADER_CACHE'

class MessageHeaderCache {
  constructor (ipfs) {
  	this.ipfs = ipfs
    this.map = new Map()
  }

  /**
   * Returns a promise that resolves to the message header
   */
  getMessageHeader (hash) {
  	const header = this.map.get(hash)
  	if (header) {
      log.info(`${MODULE_NAME}: ${hash} found locally`)
      return Promise.resolve(header)
    }

    log.info(`${MODULE_NAME}: ${hash} not found locally`)
  	return this.ipfs.object.data(hash, { enc: 'base58' })
    	.then((data) => {
    		const obj = JSON.parse(data)
	      return Promise.resolve(obj)
    })
  }

  deleteMessageHeader (hash) {
  	this.map.delete(hash)
    log.info(`${MODULE_NAME}: Deleted ${hash}`)
  }

  addMessageHeader (hash, message) {
  	this.map.set(hash, message)
    log.info(`${MODULE_NAME}: Added ${hash}`)
  }
}

module.exports = MessageHeaderCache
