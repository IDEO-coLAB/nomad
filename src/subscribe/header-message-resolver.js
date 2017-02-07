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

const MODULE_NAME = 'HEADER_RESOLVER'

class HeaderMessageResolver {
  /**
   * @param {function} new message handler.
   */
  constructor (subscriptionId, ipfs, handler) {
    this.subscriptionId = subscriptionId
    this.ipfs = ipfs
    this.handler = handler
    this.queue = new PQueue({concurrency: 1})

    this.deliverMessageForHeader = this.deliverMessageForHeader
    this.fetchAndDeliver = this.fetchAndDeliver
  }

  fetchAndDeliver(header) {
    const dataHash = (R.find(R.propEq('name', 'data'))(header.links)).multihash

    log.info(`${MODULE_NAME}: Fetching message for ${header.multihash}`)

    return this.ipfs.files.cat(dataHash)
      .then((stream) => {
        return streamToString(stream)
      })
      .then((message) => {
        log.info(`${MODULE_NAME}: Delivering message for ${header.multihash}`)

        const messageObj = {
          message: message,
          id: this.subscriptionId,
          link: header.multihash
        }
        this.handler(messageObj)

        return Promise.resolve(null)
      })
  }

  deliverMessageForHeader(header) {
    log.info(`${MODULE_NAME}: Adding ${header.multihash} to the delivery queue`)

    this.queue.add(() => {
      return this.fetchAndDeliver(header)
    })
  }
}

module.exports = HeaderMessageResolver
