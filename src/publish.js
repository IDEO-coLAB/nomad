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
  log(`${MODULE_NAME}: Publishing new sensor head: ${dag.toJSON().Hash} with links`, dag.toJSON().Links)

  return ipfsUtils.object.put(dag)
    .then((headDAG) => {
      node.head.DAG = headDAG
      return ipfsUtils.name.publish(headDAG)
    })
    .then((published) => {
      // { Name: <cur node id>, Value: <new node head hash> }
      node.head.path = `/ipfs/${published.Value}`
      return node
    })
}

// Resolve the current sensor head based on the sensor ipfs id
const resolveSensorHead = (node) => {
  const id = node.identity.ID
  log(`${MODULE_NAME}: Resolving sensor head: ${id} via IPNS`)

  return ipfsUtils.name.resolve(id)
}

// API

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
      logError(`${MODULE_NAME}: Failed to sync sensor head with network`, err.message)
      return Promise.reject({ syncHead: error })
    })
}

// API

module.exports = {
  publish: publishSensorData,
  publishRoot: publishSensorRoot,
  syncHead,
}
