/** 
  * Implements get and set dictionary operations 
  */
  


// FAULT TOLERANT LIFECYCLE
// startBatch: marks the beginning of a series of operations that should be atomic
// endBatch: marks the end of a series of operations that should be atomic
// A batch should be persisted atomically. This may only be relevant in Node.js not browser

class State {
  // constructor needs to be passed a store object that implements
  // a get and set function. Lets us decouple this interface from
  // Node.js filesystem implementation vs browserland local storage
  // implementation. Get and set functions should return promises.
  constructor (store) {
    this.store = store
  }

  /**
   * Get head DAG node for the stream
   * @param {string} streamHash - the hash or peerid of the stream
   * @return {Promise} Promise resolves to a DAG node object
   */
  getHeadForStream (streamHash) {
    return this.store.get(streamHash)
  }

  /**
   * Set head DAG node for the stream
   * @param {string} streamHash - the hash or peerid of the stream
   * @param {string} object - the DAG object to be stored
   * @return {Promise} Promise resolves to a DAG node object
   */
  setHeadForStream (streamHash, object) {
   return this.store.set(streamHash, object)
  }
}

module.exports = State
