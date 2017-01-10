/**
 * Resolves message headers to full messages and delivers to user callback.
 * Implemented using a p-queue since we need to make async calls (to ipfs)
 * to look up message data, but want to deliver messages to user in same
 * order that headers are delivered to this object.
 */

const R = require('ramda')
const PQueue = require('p-queue')
const streamToString = require('stream-to-string')

const log = require('../utils/log')

const MODULE_NAME = 'MSG_HEADER_RESOLVER'

class HeaderMessageResolver {
  /**
   * @param {function} new message handler.
   */
  constructor (ipfs, handler) {
    this.ipfs = ipfs
    this.handler = handler
    this.queue = new PQueue({concurrency: 1})
  }

  fetchAndDeliver (header) {
    const dataHash = (R.find(R.propEq('name', 'data'))(header.links)).multihash
    log.info(`${MODULE_NAME}: Attempting delivery of ${dataHash}...`)

    return this.ipfs.files.cat(dataHash)
      .then((stream) => {
        return streamToString(stream)
      })
      .then((message) => {
        this.handler(message)
        log.info(`${MODULE_NAME}: Delivered ${dataHash}`)
        return Promise.resolve(null)
      })
  }

  deliverMessageForHeader (header) {
    this.queue.add(() => {
      return this.fetchAndDeliver(header)
    })
    .catch(console.log)
  }
}

module.exports = HeaderMessageResolver
