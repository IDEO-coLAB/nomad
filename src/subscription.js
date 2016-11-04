const Q = require('q')
const R = require('ramda')

const log = require('./utils/log')
const ipfsUtils = require('./utils/ipfs')
const { NomadError, passOrDie } = require('./utils/errors')
const messageStore = require('./message-store')
const subscriptionStore = require('./subscription-store')

const MODULE_NAME = 'SUBSCRIPTION'

// How often to poll for new subscription messages
// TODO: maybe move this into subscription.js
const POLL_MILLIS = 1000 * 10


// TODO: Move to IPFS utils???
// TODO: Move to IPFS utils???
// TODO: Move to IPFS utils???
// Extract the data link from a specified object
//
// @param {String} id (b58 ipfs object hash)
// @param {String} linkName (optional)
//
// @return {Promise}
//
const pluckLinkFromIpfsObject = (id, linkName='data') => {
  log.info(`${MODULE_NAME}: fetching data for object ${id}`)

  // console.log(id)
  // console.log(linkName)

  return ipfsUtils.object.get(id)
    .then((object) => {
      const links = object.links
      if (R.isNil(links)) {
        log.info(`${MODULE_NAME}: head object is missing a links property`)
        throw new NomadError('head object is missing links property')
      }

      const data = R.find(R.propEq('name', linkName), links)
      if (R.isNil(data)) {
        log.info(`${MODULE_NAME}: head object is missing a ${linkName} link`)
        throw new NomadError(`head object is missing a ${linkName} link`)
      }

      const encoded = ipfsUtils.base58FromBuffer(data.hash)
      return Promise.resolve(encoded)
    })
}



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
    this.link = subscriptionStore.get(subscriptionId) || null
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
        log.info(`${MODULE_NAME}: ${POLL_MILLIS/1000} seconds until next poll for ${this.id}`)
        setTimeout(() => this._poll(), POLL_MILLIS)
      })
      .catch(passOrDie(MODULE_NAME))
      .catch((err) => {
        log.err(`${MODULE_NAME}: POLL ERR ${this.id}`)
        console.log(err)
        return Promise.reject(err)
      })
  }

  // Get the head object from the network for a single subscription
  //
  // @param {String} id (b58 ipfs object hash)
  //
  // @return {Promise} b58 hash
  //
  _getHead() {
    log.info(`${MODULE_NAME}: Fetching head for ${this.id}`)

    return ipfsUtils.name.resolve(this.id)
      .then(subscriptionObj => R.prop('Path', subscriptionObj))
      .then((objectHash) => {
        const head = ipfsUtils.extractMultihashFromPath(objectHash)
        return Promise.resolve(head)
      })
  }

  // Sync the network's subscription head with the local subscription index
  //
  // @param {String} head
  //
  // @return {Promise} b58 hash
  //
  _syncHead(head) {
    log.info(`${MODULE_NAME}: Syncing local and remote heads for ${this.id}`)

    const localIndex = subscriptionStore.get(this.id)

    // if there is no locally stored subscription head, write it to disk and continue
    if (R.isNil(localIndex)) {
      log.info(`${MODULE_NAME}: No local head found, adding new local head for ${this.id}`)
      subscriptionStore.put(this.id, head)
      return this._deliverMessage(head)
    }

    // if the locally stored subscription head is in sync with the
    // network's latest version of the head, continue
    if (localIndex === head) {
      log.info(`${MODULE_NAME}: Local head matches remote head for ${this.id}`)
      return this._deliverMessage(head)
    }

    // if the locally stored subscription head is NOT in sync with the
    // network's latest version of the head, then walk back to fund the
    // head that matches our local head, then start delivering the message
    // backlog in order
    log.info(`${MODULE_NAME}: Local head does not match remote head for ${this.id}`)
    return this._walkBack(head)
  }

  // Deliver the message (data) for a given head object hash
  //
  // @param {String} head
  //
  // @return {Promise}
  //
  _deliverMessage(head) {
    const index = subscriptionStore.get(this.id)

    if (head === index) {
      log.info(`${MODULE_NAME}: Network head was unchanged for ${this.id}`)
      return Promise.resolve(true)
    }

    let messageLink

    return pluckLinkFromIpfsObject(head)
      .then((link) => {
        messageLink = link
        return ipfsUtils.object.cat(link)
      })
      .then((message) => {
        log.info(`${MODULE_NAME}: Delivering new message (${head}) for ${this.id}`)

        // Add the subscription head link as the local index
        subscriptionStore.put(this.id, head)
        // Add the new message to the store
        const storedMessage = messageStore.put(this.id, message, messageLink)
        // Call the user-supplied callbacks for the new message
        const result = { id: this.id, message: storedMessage, }

        try {
          log.info(`${MODULE_NAME}: Calling handlers for ${this.id}`)
          R.forEach((handler) => handler(result), this._handlers)
        } catch (err) {
          log.err(`${MODULE_NAME}: Error when calling handlers for ${this.id}`)
        }
        return true
      })
  }

  _walkBack(link, localIdx) {
    log.info(`${MODULE_NAME}: Walking back for ${this.id}`)

    let localIndex = localIdx || subscriptionStore.get(this.id)

    this._backlog.unshift(link)

    return pluckLinkFromIpfsObject(link, 'prev')
      .then((prevLink) => {
        if (localIndex !== prevLink) {
          log.info(`${MODULE_NAME}: Local index and network head do not match for ${this.id}`)
          return this._walkBack(prevLink, localIndex)
        }
        log.info(`${MODULE_NAME}: Successfully walked back to the next head (${prevLink}) for ${this.id}`)
        return this._deliverBacklog()
      })
      .catch((err) => {
        log.err(`${MODULE_NAME}: WALK BACK ERR ${this.id}`)
        console.log(err)
        return Promise.reject(err)
      })
      // TODO: how do we best handle errors here?
  }

  _deliverBacklog() {
    if (!this._backlog.length) {
      log.info(`${MODULE_NAME}: Finished delivering the backlog for ${this.id}`)
      return Promise.resolve(true)
    }

    const linkToDeliver = R.head(this._backlog.splice(0, 1))
    log.info(`${MODULE_NAME}: Delivering the backlog link ${linkToDeliver} for ${this.id}`)

    return this._deliverMessage(linkToDeliver)
      .then((messages) => {
        return this._deliverBacklog()
      })
      .catch((err) => {
        log.err(`${MODULE_NAME}: DELIVER BACKLOG ERR ${this.id}`)
        console.log(err)
        return Promise.reject(err)
      })
  }

  _removeHandler(handler) {
    return () => {
      const idxToRemove = R.indexOf(handler, this._handlers)
      let newHandlers = this._handlers.slice(0)
      newHandlers.splice(idxToRemove, 1)
      this._handlers = newHandlers
      return true
    }
  }
}
