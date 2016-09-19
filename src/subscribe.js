'use strict'

const multihash = require('multihashes')
const R = require('ramda')
const Q = require('q')

const { log, logError } = require('./utils/log')
const ipfsUtils = require('./utils/ipfs')

const MODULE_NAME = 'SUBSCRIBE'









// Name resolve a single IPNS name to an IPLD object hash
// returns a promise that resolves to IPLD object hash
// const resolveIPNSName = (subMultihash) => {
//   log('SUBSCRIBE: Attempting to resolve subMultihash ', subMultihash)

//   // We use all settled so that we can handle failures and mark them
//   // as disconnected subMultihashs in the node
//   return ipfsUtils.resolve(subMultihash)
//     .then((data) => Promise.resolve({ source: subMultihash, data }))
//     .catch((error) => Promise.resolve({ source: subMultihash }))
// }

// name resolve a list of multihashes
// const nameResolveMultihashes = (subscriptions) => {
//   log('SUBSCRIBE: Attempting to resolve ' + R.length(subscriptions) + ' subscriptions')

//   return Q.allSettled(R.map(nameResolveSingleMultihash, subscriptions))
// }





















// Note: expects a list of fulfilled promises
// This is different from successfully resolved promises - These could be failures
// const updateSubscriptionStates = (results, node) => {
//   log('SUBSCRIBE: Handling all subscription DAG resolutions')
//   R.forEach((connection) => {
//     let id = connection.source
//     node.subscriptions[id] = {
//       connected: connection.error ? false : true,
//       data: connection
//     }
//   }, R.pluck('value', results))
//   return node
// }

// const getDataDAGsFromConnectedSubscriptionDAGs = (node) => {
//   const subscriptions = R.filter((sub) => sub.connected , node.subscriptions)
//   log('SUBSCRIBE: Attempting to get data DAGs for ' + R.length(R.keys(subscriptions)) + ' subscription DAGs')

//   return Q.allSettled(R.map((subDAG) => {
//     let path = subDAG.data.data.Path
//     console.log(path)


//     let foo
//     const timer = new Promise((resolve, reject) => {
//       foo = setTimeout(() => {
//         log('timeout fired')
//         reject()
//       }, 5000)
//     })


//     // return ipfsUtils.getDAGObjectFromDAGPath(path)
//     const resolver = ipfsUtils.getDAGObjectFromDAGPath(path)
//       .then((data) => {
//         console.log('got data in all settled ', data)
//         clearTimeout(foo)
//         return data
//       })

//     return Promise.race([timer, resolver])

//   }, subscriptions))
// }






// for any message object in the linked list of messages, 
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



// const getDataFromDataDAGs = (results, node) => {
//   log('SUBSCRIBE: Attempting to get data from the data DAGs')
//   console.log(results)

//   const headBuffersToFetch = R.map((DAGObject) => R.pluck('hash', DAGObject.links), results)
//   return Q.all(R.map((buffer) => ipfsUtils.getDAGDataFromBuffer(buffer), headBuffersToFetch))
// }

// only calls callback if at least one subscription has a new message
const getNewSubscriptionMessages = (subscriptions, cb) => {

  let nameToData = R.pipeP(
    ipfsUtils.name.resolve,
    R.prop('Path'),
    messageDataObjectHash,
    ipfsUtils.object.cat
  )

  return Promise.all(R.map((subscription) => {
    return nameToData(subscription).then((message) => {
      return Promise.resolve({ subscription, message })
      })
    }, subscriptions))
  .then((latest) => {
    debugger
  })
}


module.exports = { getNewSubscriptionMessages }
