/**
 * Caches incoming message headers that have been delivered by the network
 * but have not yet been delivered to the user's callback. If a request
 * isn't in the cache, uses ipfs to fetch it.
 */

 const log = require('../utils/log')

 const MODULE_NAME = 'HEADER_CACHE'

 // Currently assuming that this doesn't need to be persisted to disk, only needs to be in memory
 // TODO: should we be using Maps. What about browser compatability?
 // Think we're ok on compat: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Map

 class MessageHeaderCache {
  constructor (ipfs) {
  	this.ipfs = ipfs
    this.map = {}
  }

  /**
   * Returns a promise that resolves to the message header
   */
  getMessageHeader(hash) {
  	const header = this.map[hash]
  	if (header) {
      log.info(`${MODULE_NAME}: Found ${hash} in cache`)
      return Promise.resolve(header)
    }

    // return this.ipfs.object.data(hash, { enc: 'base58' })
  	return this.ipfs.object.get(hash, { enc: 'base58' })
    	.then((data) => {
        log.info(`${MODULE_NAME}: Did not find ${hash} in cache`)

        const obj = data.toJSON()
	      return Promise.resolve(obj)
    })
  }

  deleteMessageHeader(hash) {
    log.info(`${MODULE_NAME}: Deleting ${hash} from cache`)
  	delete this.map[hash]
  }

  addMessageHeader(hash, message) {
    log.info(`${MODULE_NAME}: Adding ${hash} to cache`)
  	this.map[hash] = message
  }
}

module.exports = MessageHeaderCache
