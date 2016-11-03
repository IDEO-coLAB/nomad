const fs = require('fs')
const Q = require('q')
const R = require('ramda')

const log = require('./utils/log')
const ipfsUtils = require('./utils/ipfs')
const config = require('./utils/config')
const { NomadError, passOrDie } = require('./utils/errors')
const messageStore = require('./message-store')

const MODULE_NAME = 'SUBSCRIPTION'

// How often to poll for new subscription messages
// TODO: maybe move this into subscription.js
const POLL_MILLIS = 1000 * 10

const SUB_HEADS_PATH = config.path.subscriptionHeads

// Get a link to the subscription link cache
//
// @param {String} id
//
// @return {String} || null
//
getLink = (id) => {
  const buffer = fs.readFileSync(SUB_HEADS_PATH)
  const links = JSON.parse(buffer.toString())
  return links[id] || null
}

// Add a link to the subscription link cache
//
// @param {String} id
// @param {String} link
//
putLink = (id, link) => {
  const buffer = fs.readFileSync(SUB_HEADS_PATH)
  const links = JSON.parse(buffer.toString())
  links[id] = link
  fs.writeFileSync(SUB_HEADS_PATH, `${JSON.stringify(links)}\r\n`)
}

// Extract the data link from a specified object
//
// @param {String} id (b58 ipfs object hash)
//
// @return {Promise}
//
const getDataLink = (id) => {
  log.info(`${MODULE_NAME}: fetching data for object ${id}`)

  return ipfsUtils.object.get(id)
    .then((object) => {
      const links = object.links
      if (R.isNil(links)) {
        log.info(`${MODULE_NAME}: head object is missing a links property`)
        throw new NomadError('head object is missing links property')
      }

      const data = R.find(R.propEq('name', 'data'), links)
      if (R.isNil(data)) {
        log.info(`${MODULE_NAME}: head object is missing a data link`)
        throw new NomadError('head object is missing a data link')
      }

      const encoded = ipfsUtils.base58FromBuffer(data.hash)
      return Promise.resolve(encoded)
    })
}























// Get the head object from the network for a single subscription
//
// @param {String} id (b58 ipfs object hash)
//
// @return {Promise}
//  {
//    source: <b58_hash>,   // IPNS subscription hash
//    head: <b58_hash>      // hash is a b58 encoded
//  }
//
const getHead = (id) => {
  log.info(`${MODULE_NAME}: Fetching head for subscription ${id}`)

  return ipfsUtils.name.resolve(id)
    .then(subscriptionObj => R.prop('Path', subscriptionObj))
    .then((objectHash) => {
      const head = ipfsUtils.extractMultihashFromPath(objectHash)
      return Promise.resolve({ source: id, head })
    })
}

// sync the network's subscription head with the local subscription head
//
// @param {Object} head (subscription's head object)
//  {
//    source: <b58_hash>,         // IPNS subscription hash
//    head: <b58_hash>            // hash is a b58 encoded
//  }
//
// @return {Promise}
//
const syncHead = (head) => {
  log.info(`${MODULE_NAME}: Syncing local and remote heads for subscription ${head.source}`)

  // if there is no locally stored subscription head, write it to disk and continue
  const link = getLink(head.source)
  if (R.isNil(link)) {
    putLink(head.source, head.head)
    return Promise.resolve(head.head)
  }

  return Promise.resolve({ source: head.source, head: head.head })
}

// Returns the message (data) for a given object
//
// @param {String} id (a b58 encoded string)
// @param {String} link (a b58 encoded string)
//
// @return {Promise}
//  {
//    message: <data>
//  }
//
const getMessage = (args) => {
  let { head, source } = args
  let messageLink

  log.info(`${MODULE_NAME}: Getting messages for subscription ${source}`)

  return getDataLink(head)
    .then((link) => {
      messageLink = link
      return ipfsUtils.object.cat(link)
    })
    .then((message) => {
      return messageStore.put(source, message, messageLink)
    })
}

// Class: Subscription
//
module.exports = class Subscription {
  constructor(subscriptionId) {
    this.id = subscriptionId
    this._handlers = []
    // set the latest head from disk
    this.link = getLink(subscriptionId) || null
  }

  start() {
    // start polling
    this._poll()
  }

  _poll() {
    // ipfsUtils.id() // better online check?
    getHead(this.id)
      .then(syncHead)
      .then(getMessage)
      .then(() => {
        console.log('going to poll in 10 seconds')
        setTimeout(() => this._poll(), POLL_MILLIS)
      })
      .catch(passOrDie(MODULE_NAME))
      .catch(console.log)
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
}
