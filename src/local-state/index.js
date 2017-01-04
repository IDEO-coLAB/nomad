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

class State {
  constructor () {
    this.store = { streams: {} }
  }

  /**
   * Get head DAG node for the stream
   * @param {string} streamHash - the hash or peerid of the stream
   * @return {Promise} Promise resolves to a DAG node object
   */
  getHeadForStream (streamHash) {
    return Promise.resolve(this.store.streams[streamHash])
  }

  /**
   * Set head DAG node for the stream
   * @param {string} streamHash - the hash or peerid of the stream
   * @param {string} object - the DAG object to be stored
   * @return {Promise} Promise resolves to a DAG node object
   */
  setHeadForStream (streamHash, object) {
   this.store.streams[streamHash] = object
   return Promise.resolve(object)
  }
}

module.exports = State
