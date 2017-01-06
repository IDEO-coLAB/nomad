/**
 * Caches incoming messages that have been delivered by the network
 * but have not yet been delivered to the user's callback.
 */

 // Currently assuming that this doesn't need to be persisted to disk, only needs to be in memory
 // TODO: should we be using Maps. What about browser compatability?

 class MessageCache {
  constructor () {
    this.map = {}
  }

  getMessage(hash) {
  	return this.map[hash]
  }

  clearMessage(hash) {
  	delete this.map[hash]
  }

  addMessage(hash, message) {
  	this.map[hash] = message
  }
}


