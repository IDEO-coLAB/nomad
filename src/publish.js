const fs = require('fs')
const R = require('ramda')
const path = require('path')

const log = require('./utils/log')
const config = require('./utils/config')
const ipfsUtils = require('./utils/ipfs')

const MODULE_NAME = 'PUBLISH'
const NODE_HEAD_PATH = config.path.head

// Initialize a new sensor head object
const initNewNodeHead = (data) => {
  log.info(`${MODULE_NAME}: Initializing a new sensor head object`)

  return Promise.all([ipfsUtils.object.create(), ipfsUtils.data.add(data)])
    .then((results) => {
      const emptyDAG = R.head(results) // target
      const dataDAG = R.head(R.last(results)) // source
      const linkName = 'data'

      log.info(`${MODULE_NAME}: Adding '${linkName}' link to new sensor head`)

      return ipfsUtils.object.link(dataDAG.node, emptyDAG, 'data')
    })
}

// Link the previous sensor head to the new sensor head
const linkNewNodeHeadToPrev = (sourceDAG, targetDAG) => {
  const linkName = 'prev'
  log.info(`${MODULE_NAME}: Adding '${linkName}' link to new sensor head`)

  return ipfsUtils.object.link(sourceDAG, targetDAG, linkName)
}

// Publish the new sensor head to the network
const publishNewNodeHead = (dag, node) => {
  log.info(`${MODULE_NAME}: Publishing new sensor head: ${dag.toJSON().Hash} with links`, dag.toJSON().Links)

  return ipfsUtils.object.put(dag)
    .then((headDAG) => {
      node.head.DAG = headDAG
      return ipfsUtils.name.publish(headDAG)
    })
    .then((published) => {
      // { Name: <cur node id>, Value: <new node head hash> }
      node.head.path = `/ipfs/${published.Value}`

      // write the head
      fs.writeFileSync(NODE_HEAD_PATH, JSON.stringify(node.head))

      return node
    })
}

// Resolve the current sensor head based on the sensor ipfs id
const resolveNodeHead = (node) => {
  const id = node.identity.ID
  log.info(`${MODULE_NAME}: Resolving sensor head: ${id} via IPNS`)

  return ipfsUtils.name.resolve(id)
}

// Publish the a first sensor root object in the network
// This will have no 'prev' link in it
const publishNodeRoot = (data, node) => {
  log.info(`${MODULE_NAME}: Publishing sensor root`)

  return initNewNodeHead(data)
    .then(newDAG => publishNewNodeHead(newDAG, node))
    .catch(error => Promise.reject({ PUBLISH_ROOT_ERROR: error }))
}

// Publish new sensor data to the network
const publishNodeData = (data, node) => {
  log.info(`${MODULE_NAME}: Publishing sensor data`)

  return initNewNodeHead(data)
    .then(newDAG => linkNewNodeHeadToPrev(node.head.DAG, newDAG))
    .then(newDAG => publishNewNodeHead(newDAG, node))
    .catch(error => Promise.reject({ PUBLISH_ERROR: error }))
}

// Sync the sensor object with the latest head in the network
const syncHead = (node) => {
  log.info(`${MODULE_NAME}: Syncing sensor head with network`)

  return resolveNodeHead(node)
    .then((head) => {
      const hPath = head.Path

      node.head.path = hPath
      log.info(`${MODULE_NAME}: Resolved to sensor head ${hPath}`)

      // Needs to be a /ipfs/ prefix, not /ipns/
      // TODO: better sanity checking
      return ipfsUtils.object.get(hPath)
    })
    .then((headDAG) => {
      log.info(`${MODULE_NAME}: Updating sensor head with resolved network DAG object`)

      node.head.DAG = headDAG
      return node
    })
    .catch((error) => {
      log.err(`${MODULE_NAME}: Failed to sync sensor head with network`, error.message)
      return Promise.reject({ syncHead: error })
    })
}

// API

module.exports = {
  publish: publishNodeData,
  publishRoot: publishNodeRoot,
  syncHead,
}
