// HEAVY WIP

/* Local state operations include tracking which nodes a node is subscribed
to, which messages (for each subscription) have been delivered to user code,
and any user code local state that needs to persist accross process failures. */


// SUBSCRIPTIONS

// get existing subscriptions
// remove subscription from cache
// get head hash for existing subscription
// set head hash for existing subscription
// clear head hash for existing subscription

// PUBLISHING



// LOCAL STATE
// For a later rev?
// get arbitrary data
// put arbitrary data

// FAULT TOLERANT LIFECYCLE
// startBatch: marks the beginning of a series of operations that should be atomic
// endBatch: marks the end of a series of operations that should be atomic
// A batch should be persisted atomically. This may only be relevant in Node.js not browser

//
//
// Gavin note: I tweaked this into a simple class because multiple nodes end
// up writing to the same store--needed to change that for mult-node testing
//
//

// const objectStore = {
// 	streams: {}
// }

// const getHeadForStream = (streamHash) => {
// 	return objectStore.streams[streamHash]
// }

// const setHeadForStream = (streamHash, objectHash) => {
// 	objectStore.streams[streamHash] = objectHash
// 	return objectHash
// }

class State {
  constructor () {
    this.store = { streams: {} }
  }

  getHeadForStream (streamHash) {
    return this.store.streams[streamHash]
  }

  setHeadForStream (streamHash, objectHash) {
   this.store.streams[streamHash] = objectHash
   return objectHash
  }
}

module.exports = {
  State,
	// getHeadForStream,
	// setHeadForStream
	// clearHeadForStream
}
