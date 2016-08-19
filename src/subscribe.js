const bs58 = require('bs58')
const ipfsApi = require('ipfs-api')
const Q = require('q')
const R = require('ramda')

const utils = require('./utils')
const log = require('./log')

const ipfs = ipfsApi()

const resolveOne = (subscription) => {
  return ipfs.name.resolve(subscription)
    .then((data) => Promise.resolve({ source: subscription, data }))
    .catch((error) => Promise.resolve({ source: subscription, error: error.message }))
}

const resolveAll = (subscriptions) => {
  log('Resolving ' + R.length(subscriptions) + ' subscriptions')

  return Q.allSettled(R.map(resolveOne, subscriptions))
}

// Note: expects a list of fulfilled promises (different than successfully resolved! These could be failures)
const handleResolutionResults = (results, node) => {
  log('Handling resolution results')

  R.forEach((con) => {
    return con.error
      ? node.subscriptions.disconnected.push(con)
      : node.subscriptions.connected.push(con)
    }, R.pluck('value', results))
  return node
  // if (R.isEmpty(node.subscriptions.disconnected)) return node
  // return Promise.reject({ disconnectedSubscriptions: node.subscriptions })
}

const getRawDataObjectsFromConnectedSubscriptions = (node) => {
  const subscriptions = node.subscriptions.connected
  return Q.all(R.map((sub) => utils.getDAGObjectFromDAGPath(sub.data.Path), subscriptions))
}


// WIP
// WIP
// WIP
// WIP
const getDataXXFromSubscriptionsXX = (results, node) => {
  // console.log(results[0].links[0].hash)
  const headBuffersToFetch = R.map((DAGObject) => R.pluck('hash', DAGObject.links), results)


  return node
}

module.exports.sync = (node) => {
  return resolveAll(node.config.subscriptions)
    .then((results) => handleResolutionResults(results, node))
    .then((node) => getRawDataObjectsFromConnectedSubscriptions(node))
    .then((results) => getDataXXFromSubscriptionsXX(results, node))
    .catch((error) => {
      return Promise.reject({ subscribeSyncError: error })
    })
}
