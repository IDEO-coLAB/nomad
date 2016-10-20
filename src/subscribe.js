// TODO: remove keys
// "QmYcbm7GPAd3S7nSSrsxuyxef9KQ7fR3SkTmLcWX9BdN8y"   // resolves (is an id)
// "Qmf8Ps1gfrkDRXjF2vsBwEbThczvPepSzXUA3yh64aSVD6"   // does not resolve
// "Qmc6cSnvbGUfiJaUmu5tX4AzX1HUqdrokLvDMJk5gihQ76" is a content hash


const R = require('ramda')

const log = require('./utils/log')
const ipfsUtils = require('./utils/ipfs')
const NomadError = require('./utils/errors')

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
  log.info(`${MODULE_NAME}: fetching data for head object at ${headObjectPath}`)
  return ipfsUtils.object.get(headObjectPath).then((object) => {
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

    // base 58 encode. Downstream functions expect this
    const encoded = ipfsUtils.base58FromBuffer(data.hash)
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
  log.info(`${MODULE_NAME}: Getting message head objects for subscriptions`)
  const nameToLatestObjectHash = R.pipeP(
    ipfsUtils.name.resolve,
    R.prop('Path')
  )
  return Promise.all(
    R.map(
      subscription => nameToLatestObjectHash(subscription)
      .then(objectHash => Promise.resolve({ name: subscription, head: objectHash }))
      , subscriptions
    )
  )
}

// given list of objects: {name, head} where name is IPNS subscription name
// and hash is head message object hash, returns promise that resolves to
// list of latest messages: {name, message}
const getCurrentMessagesFromHeadObjectHashes = (hashesObject) => {
  log.info(`${MODULE_NAME}: Getting current subscription messages`)

  const procs = R.pipeP(messageDataObjectHash, ipfsUtils.object.cat)

  return Promise.all(
    R.map(
      hashObject => procs(hashObject.head)
      .then(message => Promise.resolve({ name: hashObject.name, message }))
      , hashesObject
    )
  )
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
    const heads = R.pluck('head', headObjects)
    if (allSameMessages(previousSubscriptionHashses, heads)) {
      // should we worry about returning promises, since we call a callback with new messages
      log.info(`${MODULE_NAME}: No new messages for any subscription`)
      return Promise.resolve()
    }

    previousSubscriptionHashses = heads
    return getCurrentMessagesFromHeadObjectHashes(headObjects)
    .then((messageObjects) => {
      log.info(`${MODULE_NAME}: About to call message handler callback`)
      cb(messageObjects)
      return Promise.resolve()
    })
  })
}

module.exports = { getNewSubscriptionMessages }
