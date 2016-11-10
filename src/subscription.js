const R = require('ramda')

const log = require('./utils/log')
const ipfsUtils = require('./utils/ipfs')
const { passOrDie } = require('./utils/errors')
const messageCache = require('./message-cache')
const subscriptionCache = require('./subscription-cache')

const MODULE_NAME = 'SUBSCRIPTION'

// How often to poll for new subscription messages
// TODO: maybe move this into subscription.js
const POLL_MILLIS = 1000 * 10

// Class: Subscription
//
module.exports = class Subscription {
  constructor(subscriptionId) {
    this.id = subscriptionId
    // user-supplied handlers to call when new data arrives
    this._handlers = []
    // a backlog to handle message delivery if the local subscription head
    // gets out of sync from the network's subscription head
    this._backlog = []
    // set the latest head from disk
    this.link = subscriptionCache.get(subscriptionId) || null
  }

  addHandler(handler) {
    if (typeof handler !== 'function') {
      // do something
    }
    if (R.contains(handler, this._handlers)) {
      // do something
    }
    this._handlers.push(handler)
    // return a handle to remove the listener
    return this._removeHandler(handler)
  }

  start() {
    // start polling
    this._poll()
  }

  _poll() {
    log.info(`${MODULE_NAME}: Starting poll for ${this.id}`)

    ipfsUtils.id()  // TODO: better online check
      .then(() => this._getHead())
      .then((head) => this._syncHead(head))
      .then(() => {
        log.info(`${MODULE_NAME}: ${POLL_MILLIS / 1000} seconds until next poll for ${this.id}`)
        setTimeout(() => this._poll(), POLL_MILLIS)
      })
      .catch(passOrDie(MODULE_NAME))
      .catch((err) => {
        log.err(`${MODULE_NAME}: Poll error for ${this.id}`, err)
        setTimeout(() => this._poll(), POLL_MILLIS)
      })
  }

  // Get the head object from the network for a single subscription
  //
  // @param {String} id (b58 ipfs object hash)
  //
  // @return {Promise} b58 hash
  //
  _getHead() {
    log.info(`${MODULE_NAME}: Fetching remote head for ${this.id}`)

    return ipfsUtils.name.resolve(this.id)
      .then(subscriptionObj => R.prop('Path', subscriptionObj))
      .then((objectHash) => {
        const head = ipfsUtils.extractMultihashFromPath(objectHash)
        return Promise.resolve(head)
      })
      .catch((err) => {
        log.err(`${MODULE_NAME}: _getHead error for ${this.id}`, err)
        return Promise.reject(err)
      })
  }

  // Sync the network's subscription head with the local subscription index
  //
  // @param {String} head
  //
  // @return {Promise} b58 hash
  //
  _syncHead(head) {
    log.info(`${MODULE_NAME}: Syncing local index and remote head for ${this.id}`)

    const localIndex = subscriptionCache.get(this.id)

    // if there is no locally stored subscription head, write it to disk and continue
    if (R.isNil(localIndex)) {
      log.info(`${MODULE_NAME}: No local index found, adding new local index (${head}) for ${this.id}`)
      return this._deliverMessage(head)
    }

    // if the locally stored subscription head is in sync with the
    // network's latest version of the head, continue
    if (localIndex === head) {
      log.info(`${MODULE_NAME}: Local index (${localIndex}) matches remote head (${head}) for ${this.id}`)
      return this._deliverMessage(head)
    }

    // if the locally stored subscription head is NOT in sync with the
    // network's latest version of the head, then walk back to fund the
    // head that matches our local index, then start delivering the message
    // backlog in order
    log.info(`${MODULE_NAME}: Local index (${localIndex}) does not match remote head (${head}) for ${this.id}`)
    return this._walkBack(head)
  }

  // Deliver the message (data) for a given head object hash
  //
  // @param {String} head
  //
  // @return {Promise}
  //
  _deliverMessage(head) {
    let messageLink

    return ipfsUtils.extractLinkFromIpfsObject(head)
      .then((link) => {
        messageLink = link
        return ipfsUtils.object.cat(link)
      })
      .then((message) => {
        const index = subscriptionCache.get(this.id)

        if (head === index) {
          log.info(`${MODULE_NAME}: Remote head was unchanged for ${this.id}`)
          return true
        }
        log.info(`${MODULE_NAME}: Delivering new message (${head}) for ${this.id}`)

        const result = { id: this.id, link: messageLink, message }
        try {
          log.info(`${MODULE_NAME}: Calling handlers for ${this.id}`)

          // Call the user-supplied callbacks for the new message
          R.forEach(handler => handler(result), this._handlers)
          // Add the subscription head link as the local index
          this.link = subscriptionCache.put(this.id, head)
          // Add the new message to the store
          messageCache.put(this.id, message, messageLink)

          log.info(`${MODULE_NAME}: Handlers successfully called for ${this.id}`)
        } catch (err) {
          log.err(`${MODULE_NAME}: Error when calling handlers for ${this.id}`, err)
        }

        return true
      })
      .catch((err) => {
        log.err(`${MODULE_NAME}: _deliverMessage error for ${this.id}`, err)
        return Promise.reject(err)
      })
  }

  _walkBack(link, localIdx) {
    log.info(`${MODULE_NAME}: Walking back for ${this.id}`)

    const localIndex = localIdx || subscriptionCache.get(this.id)

    this._backlog.unshift(link)

    return ipfsUtils.extractLinkFromIpfsObject(link, 'prev')
      .then((prevLink) => {
        if (localIndex !== prevLink) {
          log.info(`${MODULE_NAME}: Local index and remote head do not match for ${this.id}`)
          return this._walkBack(prevLink, localIndex)
        }
        log.info(`${MODULE_NAME}: Found the remote pointer to the local index (${prevLink}) for ${this.id}`)
        return this._deliverBacklog()
      })
      .catch((err) => {
        log.err(`${MODULE_NAME}: _walkBack error for ${this.id}`, err)
        return Promise.reject(err)
      })
  }

  _deliverBacklog() {
    if (!this._backlog.length) {
      log.info(`${MODULE_NAME}: Finished delivering the backlog for ${this.id}`)
      return Promise.resolve(true)
    }

    const linkToDeliver = R.head(this._backlog.splice(0, 1))
    log.info(`${MODULE_NAME}: Delivering the backlog link ${linkToDeliver} for ${this.id}`)

    return this._deliverMessage(linkToDeliver)
      .then(() => this._deliverBacklog())
      .catch((err) => {
        log.err(`${MODULE_NAME}: _deliverBacklog error for ${this.id}`, err)
        return Promise.reject(err)
      })
  }

  _removeHandler(handler) {
    return () => {
      const idxToRemove = R.indexOf(handler, this._handlers)
      /* prefer-const: 0 */
      // Lint note: Do not set newHandlers as a const because we need to splice it
      // TODO: make a copy and set the node backlog as the new object
      let newHandlers = this._handlers.slice(0)
      newHandlers.splice(idxToRemove, 1)
      this._handlers = newHandlers
      return true
    }
  }
}
