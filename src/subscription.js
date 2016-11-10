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
    // TODO: decide how to use the .head property on a subscription
    // it is useful, but figure out the best way
  }

  addHandler(handler) {
    this._handlers.push(handler)
    return true
  }

  start() {
    // start polling
    this._poll()
  }

  _poll() {
    log.info(`${MODULE_NAME}: ${this.id}: Starting poll`)

    ipfsUtils.id()  // TODO: better online check
      .then(() => this._getHead())
      .then((head) => this._syncHead(head))
      .then(() => {
        log.info(`${MODULE_NAME}: ${this.id}: ${POLL_MILLIS / 1000} seconds until next poll`)
        setTimeout(() => this._poll(), POLL_MILLIS)
      })
      .catch(passOrDie(MODULE_NAME))
      .catch((err) => {
        log.err(`${MODULE_NAME}: ${this.id}: Poll error`, err)
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
    log.info(`${MODULE_NAME}: ${this.id}: Fetching remote head`)

    return ipfsUtils.name.resolve(this.id)
      .then(subscriptionObj => R.prop('Path', subscriptionObj))
      .then((objectHash) => {
        const head = ipfsUtils.extractMultihashFromPath(objectHash)
        return Promise.resolve(head)
      })
      .catch((err) => {
        log.err(`${MODULE_NAME}: ${this.id}: _getHead error`, err)
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
    log.info(`${MODULE_NAME}: ${this.id}: Syncing cached head with remote head`)

    // TODO: this is currently SLOW (it is a file read)
    // It is a stopgap until we decide how to handle caching
    const cachedHead = subscriptionCache.get(this.id)

    // if there is no cached subscription head, cache it and
    // deliver the message from the current head
    if (R.isNil(cachedHead)) {
      log.info(`${MODULE_NAME}: ${this.id}: No cached head found`)
      return this._deliverMessage(head)
    }

    // if the cached subscription head matches the remote head,
    // deliver the message from the current head
    if (cachedHead === head) {
      log.info(`${MODULE_NAME}: ${this.id}: cached head ${cachedHead} matches remote head ${head}`)
      return this._deliverMessage(head)
    }

    // if the cached subscription head does NOT match the remote head,
    // walk back to find the head that matches the cached head,
    // then deliver the message backlog in order
    log.info(`${MODULE_NAME}: ${this.id}: cached head ${cachedHead} does not match remote head ${head}`)
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
        const cachedHead = subscriptionCache.get(this.id)

        if (head === cachedHead) {
          log.info(`${MODULE_NAME}: ${this.id}: Remote head unchanged`)
          return true
        }
        log.info(`${MODULE_NAME}: ${this.id}: Delivering new message ${head}`)

        const result = { id: this.id, link: messageLink, message }

        try {
          log.info(`${MODULE_NAME}: ${this.id}: Calling handler`)


          // Call the user-supplied callbacks for the new message
          R.forEach(handler => handler(result), this._handlers)
          // Add the subscription head link as the cached head
          subscriptionCache.set(this.id, head)

          // Add the new message to the store
          messageCache.put(this.id, message, messageLink)



          log.info(`${MODULE_NAME}: ${this.id}: Handler successfully called`)
        } catch (err) {
          log.err(`${MODULE_NAME}: ${this.id}: Error calling handler`, err)
        }

        return true
      })
      .catch((err) => {
        log.err(`${MODULE_NAME}: ${this.id}: _deliverMessage error`, err)
        return Promise.reject(err)
      })
  }

  _walkBack(link, cached) {
    log.info(`${MODULE_NAME}: ${this.id}: Walking back`)

    const cachedHead = cached || subscriptionCache.get(this.id)

    this._backlog.unshift(link)

    return ipfsUtils.extractLinkFromIpfsObject(link, 'prev')
      .then((prevLink) => {
        if (cachedHead !== prevLink) {
          log.info(`${MODULE_NAME}: ${this.id}: Cached head and remote head do not match`)
          return this._walkBack(prevLink, cachedHead)
        }
        log.info(`${MODULE_NAME}: ${this.id}: Found remote ${prevLink} that points to cached head`)
        return this._deliverBacklog()
      })
      .catch((err) => {
        log.err(`${MODULE_NAME}: ${this.id}: _walkBack error`, err)
        return Promise.reject(err)
      })
  }

  _deliverBacklog() {
    if (!this._backlog.length) {
      log.info(`${MODULE_NAME}: ${this.id}: Finished delivering the backlog`)
      return Promise.resolve(true)
    }

    const linkToDeliver = R.head(this._backlog.splice(0, 1))
    log.info(`${MODULE_NAME}: ${this.id}: Delivering the backlog link ${linkToDeliver}`)

    return this._deliverMessage(linkToDeliver)
      .then(() => this._deliverBacklog())
      .catch((err) => {
        log.err(`${MODULE_NAME}: ${this.id}: _deliverBacklog error`, err)
        return Promise.reject(err)
      })
  }
}
