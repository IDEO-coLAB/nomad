const Q = require('q')
const R = require('ramda')

const log = require('./utils/log')
const ipfsUtils = require('./utils/ipfs')
const { NomadError } = require('./utils/errors')
const messageStore = require('./message-store')

const MODULE_NAME = 'SUBSCRIBE'

// Find the data object based on a Nomad pointer object's path
// and return the path for the pointer object's 'data' link
//
// Sample b58 string: Qmb3Vos8siQmz9nm74MLN1j4MwZeXw6gnggWK2aUmp71q7
//
// @param {String} objectPath (b58 ipfs object hash)
//
// @return {Promise} b58 encoded ipfs object hash string
//
const getDataHashFromPointerObjHash = (objectPath) => {
  log.info(`${MODULE_NAME}: fetching data for head object at ${objectPath}`)

  return ipfsUtils.object.get(objectPath)
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

// Get all current head objects for a node's subscription list
//
// @param {Array} subIds (Array of b58 ipfs object hashes)
//
// @return {Promise}
//  [
//    {
//      source: <b58_hash>,         // IPNS subscription hash
//      head: /ipfs/<b58_hash>      // hash is a b58 encoded
//    }
//  ]
//
const getHeadObjectsForSubscriptions = (subIds) => {
  log.info(`${MODULE_NAME}: Getting head objects for subscriptions`)

  const generateSubscriptionPromise = subId => ipfsUtils.name.resolve(subId)
    .then(subscriptionObj => R.prop('Path', subscriptionObj))
    .then(objectHash => Promise.resolve({ source: subId, head: objectHash }))

  const ipnsResolverPromises = R.map(sub => generateSubscriptionPromise(sub), subIds)

  return Q.allSettled(ipnsResolverPromises)
    .then((results) => {
      const resolvedSubs = R.filter(r => r.state === 'fulfilled', results)
      return R.map(r => r.value, resolvedSubs)
    })
}

// Returns all current head objects for a node's subscription list
//
// @param {Array} nodeHeads (list of each subscription's head/pointer object)
//  [
//    {
//      source: <b58_hash>,   // IPNS subscription hash
//      head: <b58_hash>      // head message object hash
//    }
//  ]
//
// @return {Promise}
//  [
//    {
//      source: <b58_hash>,   // IPNS subscription hash
//      message: <data>
//    }
//  ]
//
const getMessagesFromObjectHashes = (nodeHeads) => {
  log.info(`${MODULE_NAME}: Getting current subscription messages`)

  const getMessageDataFromHash = nodeHead => getDataHashFromPointerObjHash(nodeHead.head)
    .then(ipfsUtils.object.cat)
    .then(message => Promise.resolve({ source: nodeHead.source, message }))

  const getMessagePromises = R.map(nodeHead => getMessageDataFromHash(nodeHead), nodeHeads)

  return Promise.all(getMessagePromises)
}

// On message events, pass relevant messages or errors back to the user
//
// @param {Array} subscriptions (list of b58 ids)
//
// @return {Promise} b58 encoded ipfs object hash string
//
const getLatest = () => ipfsUtils.id()  // TODO: better state check to make sure node is online
  .then(subscriptions => getHeadObjectsForSubscriptions(subscriptions))
  .then((headObjects) => {
    log.info(`${MODULE_NAME}: Retrieved head objects for subscriptions`)
    console.log(headObjects)
    return getMessagesFromObjectHashes(headObjects)
  })
  .then((messageObjects) => {
    log.info(`${MODULE_NAME}: Retrieved recent messages for subscriptions`)
    return messageStore.put(messageObjects)
  })













// Class: Subscription
//
module.exports = class Subscription {
  constructor(subscriptionId) {
    this.id = subscriptionId
    this._handlers = []
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



















