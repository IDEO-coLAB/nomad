/**
 * Caches incoming message headers that have been delivered by the network
 * but have not yet been delivered to the user's callback. If a request
 * isn't in the cache, uses ipfs to fetch it.
 */

 // Currently assuming that this doesn't need to be persisted to disk, only needs to be in memory
 // TODO: should we be using Maps. What about browser compatability?

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
  	if (header) { return Promise.resolve(header) }

  	return this.ipfs.object.data(hash, { enc: 'base58' })
    	.then((data) => {
    		const obj = JSON.parse(data)
	      return Promise.resolve(obj)
    })	
  }

  deleteMessageHeader(hash) {
  	delete this.map[hash]
  }

  addMessageHeader(hash, message) {
  	this.map[hash] = message
  }
}

module.exports = MessageHeaderCache


