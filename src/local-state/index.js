/** 
  * Tracks heads of subscriptions that a node is subscribed to and / or
  * a node's own published messages.
  */

const Datastore = require('nedb')
  
// LOCAL STATE
// For a later rev?
// get arbitrary data
// put arbitrary data

// FAULT TOLERANT LIFECYCLE
// startBatch: marks the beginning of a series of operations that should be atomic
// endBatch: marks the end of a series of operations that should be atomic
// A batch should be persisted atomically. This may only be relevant in Node.js not browser

class State {
  constructor (config) {
      this.db = new Datastore({ filename: config.filePath, autoload: true })
      // Nedb will automatically persist to browser local storage
      // if filename is set and running in browser
  }

  /**
   * Get head DAG node for the stream
   * @param {string} streamHash - the hash or peerid of the stream
   * @return {Promise} Promise resolves to a DAG node object
   */
  getHeadForStream (streamHash) {
    return new Promise((resolve, reject) => {
      this.db.findOne({ streamHash: streamHash }, (err, object) => {
        if (err) {
          reject(err)
          return
        }
        if (object === null) {
          resolve(null)
          return
        }
        resolve(object.object)
      })
    })
  }

  /**
   * Set head DAG node for the stream
   * @param {string} streamHash - the hash or peerid of the stream
   * @param {string} object - the DAG object to be stored
   * @return {Promise} Promise resolves to a DAG node object
   */
  setHeadForStream (streamHash, object) {
    return new Promise((resolve, reject) => {
      this.db.insert({ streamHash, object }, 
        (err, newObj) => {
          if (err) {
            reject(err)
            return
          }
          resolve(newObj.object)
      })
    })
  }
}

module.exports = State
