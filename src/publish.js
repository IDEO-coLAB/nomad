'use strict'

const R = require('ramda')
const log = require('./utils/log')
const network = require('./utils/network')
const ipfsUtils = require('./utils/ipfs')

const DEFAULT_ROOT_MESSAGE = {
  message: 'Hello from Nomad!',
  timestamp: new Date().toString()
}

const RETRY_THROTTLE_DELAYS = [15000, 20000, 45000, 60000]

// Creates unlinked container DAG object with the data
const createNomadObject = (data) => {
  log('NOMAD: Attempting to create a new ipfs object')
  return Promise.all([ ipfsUtils.createObject(), ipfsUtils.addData(data) ])
    .then((results) => {
      const newDAGObject = R.head(results)
      const newDataDAG = R.head(R.last(results))
      return ipfsUtils.addLinkToObject(newDAGObject, newDataDAG, 'data')
    })
}

const linkNomadObjects = (sourceDAG, targetDAG) => {
  log('NOMAD: Attempting to link new head object with prev head')
  return ipfsUtils.addLinkToObject(sourceDAG, targetDAG, 'prev')
}

const updateNomadHead = (dag, node) => {
  log('NOMAD: Attempting to update and publish the new head')
  return ipfsUtils.putObject(dag)
    .then((putDAG) => {
      node.currentDAG = Object.assign({}, node.currentDAG, { data: putDAG })
      return ipfsUtils.publishObject(putDAG)
    })
    .then((publishedDAG) => {
      node.currentDAG = Object.assign({}, node.currentDAG, { path: `/ipfs/${publishedDAG.Value}` })
      return node
    })
}

const resolveNomadNodeHead = (node) => {
  log('NOMAD: Attempting to resolve the current node head')
  const id = node.identity.ID
  // TODO: what if it fails to reolve because of network delays, etc
  // THOUGHT: we might overwrite the head unwittingly and muss up the chain...
  return ipfsUtils.resolve(id)
    .then((head) => {
      const resolved = !!head
      if (resolved) return { skip: true, head }
    })
    .catch((error) => {
      return publishNomadRoot(DEFAULT_ROOT_MESSAGE, node)
    })
    .then((data) => {
      if (data.skip) return Promise.resolve(data.head)
      return network.repeatAttempt(RETRY_THROTTLE_DELAYS, () => {
        return ipfsUtils.resolve(id)
      })
    })
}

const publishNomadRoot = (data, node) => {
  log('NOMAD: Attempting to publish a new root')
  return createNomadObject(data)
    .then((newDAG) => updateNomadHead(newDAG, node))
    .catch((error) => Promise.reject({ PUBLISH_ROOT_ERROR: error }))
}

const publishNomadUpdate = (data, node) => {
  log('NOMAD: Attempting to publish a new head')
  return createNomadObject(data)
    .then((newDAG) => linkNomadObjects(newDAG, node.currentDAG))
    .then((newDAG) => updateNomadHead(newDAG, node))
    .catch((error) => Promise.reject({ PUBLISH_ERROR: error }))
}

const sync = (node) => {
  return resolveNomadNodeHead(node)
    .then((head) => {
      log('NOMAD: Resolved to current object head:', head.Path)
      node.currentDAG.path = head.Path // currently an /ipfs/ object (not ipns)
      return ipfsUtils.getDAGObjectFromDAGPath(node.currentDAG.path)
    })
    .then((headData) => {
      log('NOMAD: Set the currentDAG for the node')
      node.currentDAG.node = headData
      return node
    })
    .catch((error) => {
      return Promise.reject({ customSyncError: error })
    })
}

module.exports = {
  sync,
  publish: publishNomadUpdate
}
