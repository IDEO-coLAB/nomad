/**
 * Resolves message headers to full messages and delivers to user callback.
 * Implemented using a p-queue since we need to make async calls (to ipfs)
 * to look up message data, but want to deliver messages to user in same
 * order that headers are delivered to this object.
 */

 const PQueue = require('p-queue')
 const streamToString = require('stream-to-string')

 class HeaderMessageResolver {
  /**
   * @param {function} new message handler. 
   */
  constructor (ipfs, handler) {
    this.ipfs = ipfs
    this.handler = handler
    this.queue = new PQueue({concurrency: 1})

    this.deliverMessageForHeader = this.deliverMessageForHeader.bind(this)
    this.fetchAndDeliver = this.fetchAndDeliver.bind(this)
  }

  fetchAndDeliver(header) {
    const dataHash = (R.find(R.propEq('name', 'data'))(header.links)).multihash
    console.warn(header)
    console.warn(dataHash)
    return this.ipfs.cat(dataHash)
      .then((stream) => {
        return streamToString(stream)
      })
      .then((message) => {
        this.handler(message)
        return Promise.resolve(null)
      })
  }

  deliverMessageForHeader(header) {
    this.queue.add(() => { 
      console.warn(header)
      console.warn(this)
      return this.fetchAndDeliver(header) 
    })
  }
}

module.exports = HeaderMessageResolver