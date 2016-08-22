'use strict'

const R = require('ramda')
const { log, logError } = require('./utils/log')
const constants = require('./utils/constants')
const network = require('./utils/network')
const ipfsUtils = require('./utils/ipfs')

const MODULE_NAME = 'PUBLISH'

// Initialize a new sensor head object
const initNewSensorHead = (data) => {
  log(`${MODULE_NAME}: Initializing a new sensor head object`)

  return Promise.all([ ipfsUtils.object.create(), ipfsUtils.data.add(data) ])
    .then((results) => {
      const emptyDAG = R.head(results) // target
      const dataDAG = R.head(R.last(results)) // source
      const linkName = `data`

      log(`${MODULE_NAME}: Adding '${linkName}' link to new sensor head`)

      return ipfsUtils.object.link(dataDAG.node, emptyDAG, 'data')
    })
}

// Link the previous sensor head to the new sensor head
const linkNewSensorHeadToPrev = (sourceDAG, targetDAG) => {
  const linkName = `prev`
  log(`${MODULE_NAME}: Adding '${linkName}' link to new sensor head`)

  return ipfsUtils.object.link(sourceDAG, targetDAG, linkName)
}

// Publish the new sensor head to the network
const publishNewSensorHead = (dag, node) => {
  log(`${MODULE_NAME}: Publishing new sensor head`)

  return ipfsUtils.object.put(dag)
    .then((headDAG) => {
      node.head.DAG = headDAG
      return ipfsUtils.name.publish(headDAG)
    })
    .then((publishedDAG) => {
      console.log('published new sensor head ', publishedDAG)
      node.head.path = `/ipfs/${publishedDAG.Value}`
      return node
    })
}









// REWORK THIS
// REWORK THIS
// REWORK THIS

// Publish the current sensor head
const resolveSensorHead = (node) => {
  const id = node.identity.ID
  log(`${MODULE_NAME}: Resolving sensor head: ${id}`)





  // TODO: what if it fails to reolve because of network delays, etc
  // THOUGHT: we might overwrite the head unwittingly and muss up the chain...
  return ipfsUtils.name.resolve(id)
    .then((head) => {
      const resolved = !!head
      if (resolved) return { skip: true, head }
    })
    .catch((error) => {
      return publishSensorRoot(DEFAULT_ROOT_MESSAGE, node)
    })
    .then((data) => {
      if (data.skip) return Promise.resolve(data.head)
      return network.repeatAttempt(RETRY_THROTTLE_DELAYS, () => {
        return ipfsUtils.name.resolve(id)
      })
    })



}

// REWORK THIS
// REWORK THIS
// REWORK THIS

// Allow developer to throttle things..not us!






// Publish the a first sensor root object in the network
// This will have no 'prev' link in it
const publishSensorRoot = (data, node) => {
  log(`${MODULE_NAME}: Publishing sensor root`)

  return initNewSensorHead(data)
    .then((newDAG) => publishNewSensorHead(newDAG, node))
    .catch((error) => Promise.reject({ PUBLISH_ROOT_ERROR: error }))
}

// Publish new sensor data to the network
const publishSensorData = (data, node) => {
  log(`${MODULE_NAME}: Publishing sensor data`)

  return initNewSensorHead(data)
    .then((newDAG) => linkNewSensorHeadToPrev(node.head.DAG, newDAG))
    .then((newDAG) => publishNewSensorHead(newDAG, node))
    .catch((error) => Promise.reject({ PUBLISH_ERROR: error }))
}

// API

const publish = (data, node, opts) => {
  log(`${MODULE_NAME}: Calling internal publish`)

  const pubRoot = opts.root
  return pubRoot
    ? publishSensorRoot(data, node)
    : publishSensorData(data, node)
}

// Sync the sensor object with the latest head in the network
const syncHead = (node) => {
  log(`${MODULE_NAME}: Syncing sensor head with network`)

  return resolveSensorHead(node)
    .then((head) => {
      const hPath = head.Path

      node.head.path = hPath
      log(`${MODULE_NAME}: Resolved to sensor head ${hPath}`)

      // Needs to be a /ipfs/ prefix, not /ipns/
      // TODO: better sanity checking
      return ipfsUtils.object.get(hPath)
    })
    .then((headDAG) => {
      log(`${MODULE_NAME}: Updating sensor head with resolved network DAG object`)

      node.head.DAG = headDAG
      return node
    })
    .catch((error) => {
      return Promise.reject({ customSyncError: error })
    })
}

// API

module.exports = {
  syncHead: syncHead,
  publish: publish
}
