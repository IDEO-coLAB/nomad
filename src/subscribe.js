'use strict'

const multihash = require('multihashes')
const R = require('ramda')
const Q = require('q')

const { log, logError } = require('./utils/log')
const ipfsUtils = require('./utils/ipfs')









// Name resolve a single multihash
const nameResolveSingleMultihash = (subMultihash) => {
  log('SUBSCRIBE: Attempting to resolve subMultihash ', subMultihash)

  // We use all settled so that we can handle failures and mark them
  // as disconnected subMultihashs in the node
  return ipfsUtils.resolve(subMultihash)
    .then((data) => Promise.resolve({ source: subMultihash, data }))
    .catch((error) => Promise.resolve({ source: subMultihash }))
}

// name resolve a list of multihashes
const nameResolveMultihashes = (subscriptions) => {
  log('SUBSCRIBE: Attempting to resolve ' + R.length(subscriptions) + ' subscriptions')

  return Q.allSettled(R.map(nameResolveSingleMultihash, subscriptions))
}





















// Note: expects a list of fulfilled promises
// This is different from successfully resolved promises - These could be failures
const updateSubscriptionStates = (results, node) => {
  log('SUBSCRIBE: Handling all subscription DAG resolutions')
  R.forEach((connection) => {
    let id = connection.source
    node.subscriptions[id] = {
      connected: connection.error ? false : true,
      data: connection
    }
  }, R.pluck('value', results))
  return node
}

const getDataDAGsFromConnectedSubscriptionDAGs = (node) => {
  const subscriptions = R.filter((sub) => sub.connected , node.subscriptions)
  log('SUBSCRIBE: Attempting to get data DAGs for ' + R.length(R.keys(subscriptions)) + ' subscription DAGs')

  return Q.allSettled(R.map((subDAG) => {
    let path = subDAG.data.data.Path
    console.log(path)


    let foo
    const timer = new Promise((resolve, reject) => {
      foo = setTimeout(() => {
        log('timeout fired')
        reject()
      }, 5000)
    })


    // return ipfsUtils.getDAGObjectFromDAGPath(path)
    const resolver = ipfsUtils.getDAGObjectFromDAGPath(path)
      .then((data) => {
        console.log('got data in all settled ', data)
        clearTimeout(foo)
        return data
      })

    return Promise.race([timer, resolver])

  }, subscriptions))
}






// const getDataFromDataDAGs = (results, node) => {
//   log('SUBSCRIBE: Attempting to get data from the data DAGs')
//   console.log(results)

//   const headBuffersToFetch = R.map((DAGObject) => R.pluck('hash', DAGObject.links), results)
//   return Q.all(R.map((buffer) => ipfsUtils.getDAGDataFromBuffer(buffer), headBuffersToFetch))
// }

const sync = (node) => {
  return nameResolveMultihashes(node.config.subscriptions)
    .then((results) => updateSubscriptionStates(results, node))
    .then((node) => getDataDAGsFromConnectedSubscriptionDAGs(node))
    // .then((results) => getDataFromDataDAGs(results, node))
    .then((results) => {
      console.log('HAVE DAG DATAS!!!!!', results)
      return node
    })
    .catch((error) => {
      return Promise.reject({ subscribeSyncError: error })
    })
}


module.exports = { sync }
