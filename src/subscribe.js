const bs58 = require('bs58')
const ipfsApi = require('ipfs-api')
const Q = require('q')
const R = require('ramda')

const utils = require('./utils')
const log = require('./log')

const ipfs = ipfsApi()

const pingOne = (subscription) => {
  return ipfs.name.resolve(subscription)
    .then((data) => Promise.resolve({ source: subscription, data }))
    .catch((error) => Promise.resolve({ source: subscription, error: error.message }))
}

const pingAll = (subscriptions) => {
  log('Pinging ' + R.length(subscriptions) + ' subscriptions')

  return Q.allSettled(R.map(pingOne, subscriptions))
}

// expects a list of fulfilled promises (different than successfully resolved! These could be failures)
const handlePingResults = (results, node) => {
  log('Handling ping results')

  R.forEach((con) => {
    return con.error
      ? node.subscriptions.disconnected.push(con)
      : node.subscriptions.connected.push(con)
    }, R.pluck('value', results))

  if (R.isEmpty(node.subscriptions.disconnected)) return node
  return Promise.reject({ disconnectedSubscriptions: node.subscriptions })
}

module.exports.sync = (node) => {
  return pingAll(node.config.subscriptions)
    .then((results) => {
      return handlePingResults(results, node)
    })
}
