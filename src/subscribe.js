'use strict'

const multihash = require('multihashes')
const R = require('ramda')
const Q = require('q')

const { log, logError } = require('./utils/log')
const ipfsUtils = require('./utils/ipfs')

const MODULE_NAME = 'SUBSCRIBE'

// for any Nomad message object in the linked list of messages, 
// returns base58 encoded hash for message data IPLD object
/* For reference: Nomad stores messages as a linked list of IPLD objects. Each
   object has an empty data property and two links:
   {
      data: '',
      links: [
        { name: prev ... }
        { name: data ... }
      ]
   } 

  The data link references an IPLD object that is the head of a unixfs object that is the 
  message data. The prev link references the previous Nomad message object.
*/
const messageDataObjectHash = (headObjectPath) => {
  log(`${MODULE_NAME}: fetching data for head object at ${headObjectPath}`)
  return ipfsUtils.object.get(headObjectPath).then((object) => {
    let links = object.links
    if (R.isNil(links)) { 
      log(`${MODULE_NAME}: head object is missing a links property`)
      throw('head object is missing links property')
    }

    let data = R.find(R.propEq('name', 'data'), links)
    if (R.isNil(data)) {
      log(`${MODULE_NAME}: head object is missing a data link`)
      throw('head object is missing a data link')
    }

    // base 58 encode. Downstream functions expect this 
    let encoded = ipfsUtils.base58FromBuffer(data.hash)
    return Promise.resolve(encoded)
    })
}

// pairwise compares lists of Nomad message object hashes and returns
// true if and only if at least one pair is different. Used to decide if 
// any subscription has a new message. Should compare Nomad object, not referenced
// data object, since a stream might send the same data more than once, and we 
// should consider the same data sent a second time as a new message. The Nomad object
// hash will be different since it hashes over a link to the previous message.
const allSameMessages = (prevHashList, currentHashList) => {
  if (R.isEmpty(prevHashList) || R.isEmpty(currentHashList)) {
    return false
  }
  return R.all(R.equals(true), R.zipWith(R.equals, prevHashList, currentHashList))
}
  
// returns a promise that resolves to list of head paths:
// { name: <IPNS subscription name>, head: <head path>}
// head path is /IPNS/<hash>
const getSubscriptionHeads = (subscriptions) => {
  log(`${MODULE_NAME}: Getting message head objects for subscriptions`)
  let nameToLatestObjectHash = R.pipeP(
    ipfsUtils.name.resolve,
    R.prop('Path')
  )
  return Promise.all(R.map((subscription) => {
    return nameToLatestObjectHash(subscription)
    .then((objectHash) => {
      return Promise.resolve({name: subscription, head: objectHash})
    })
  }, subscriptions))
}

// given list of objects: {name, head} where name is IPNS subscription name
// and hash is head message object hash, returns promise that resolves to
// list of latest messages: {name, message}
const getCurrentMessagesFromHeadObjectHashes = (hashesObject) => {
  log(`${MODULE_NAME}: Getting current subscription messages`)

  let process = R.pipeP(messageDataObjectHash, ipfsUtils.object.cat)

  return Promise.all(R.map((hashObject) => {
    return process(hashObject.head).then((message) => {
      return Promise.resolve({ name: hashObject.name, message })
    })
  }, hashesObject))
}

let previousSubscriptionHashses = []
// only calls callback if at least one subscription has a new message
// returns promises, but I'm not sure if we need it to return anything,
// maybe for error handling
// TODO: accept err callback and call with any errors
const getNewSubscriptionMessages = (subscriptions, cb) => {
  getSubscriptionHeads(subscriptions)
  .then((headObjects) => {
    // headObject is list of {name, head}
    let heads = R.pluck('head', headObjects)
    if (allSameMessages(previousSubscriptionHashses, headObjects)) {
      // should we worry about returning promises, since we call a callback with new messages
      log(`${MODULE_NAME}: No new messages for any subscription`)
      return Promise.resolve()
    }

    previousSubscriptionHashses = headObjects
    return getCurrentMessagesFromHeadObjectHashes(headObjects)
    .then((messageObjects) => {
      log(`${MODULE_NAME}: About to call message handler callback`)
      cb(messageObjects)
      return Promise.resolve()
    })
  })
}

module.exports = { getNewSubscriptionMessages }
