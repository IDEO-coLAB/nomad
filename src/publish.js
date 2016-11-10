const fs = require('fs')
const R = require('ramda')

const log = require('./utils/log')
const config = require('./utils/config')
const ipfsUtils = require('./utils/ipfs')
const { setHead } = require('./node-cache')

const MODULE_NAME = 'PUBLISH'

// Initialize a new sensor head object. This is a blank IPFS DAG object.
//
// @param {Anything} data
//
// @return {Promise} blank ipfs DAG object
//
const initLatestNodeHead = (data) => {
  log.info(`${MODULE_NAME}: Initializing a new sensor head object`)

  return Promise.all([ipfsUtils.object.create(), ipfsUtils.data.add(data)])
    .then((results) => {
      const emptyDAG = R.head(results) // target
      const dataDAG = R.head(R.last(results)) // source
      const linkName = 'data'

      log.info(`${MODULE_NAME}: Adding data link to new sensor head`)

      return ipfsUtils.object.link(dataDAG.node, emptyDAG, linkName)
    })
}

// Link the previous sensor head to the new sensor head by creating the
// appropriate links in the ipfs DAG object
//
// @param {Object} sourceDAG (ipfs DAG object)
// @param {Object} targetDAG (ipfs DAG object)
//
// @return {Promise} source -> target linked ipfs DAG object
//
const linkLatestNodeHeadToPrev = (sourceDAG, targetDAG) => {
  const linkName = 'prev'
  log.info(`${MODULE_NAME}: Adding prev link to new sensor head`)
  return ipfsUtils.object.link(sourceDAG, targetDAG, linkName)
}

// Publish the nodes latest head to the network
//
// @param {Object} dag (ipfs DAG object)
// @param {Object} node (nomad node object)
//
// @return {Promise} nomad node object
//
const publishLatestNodeHead = (dag, node) => {
  log.info(`${MODULE_NAME}: Publishing new sensor head: ${dag.toJSON().Hash} with links`, dag.toJSON().Links)
  let newHead

  return ipfsUtils.object.put(dag)
    .then((headDAG) => {
      newHead = headDAG
      return ipfsUtils.name.publish(headDAG)
    })
    .then(() => {
      // write the new head to cache
      setHead(newHead)
      // Once written to disk, set the new head on the node
      node.head = newHead
      // return the full node
      return node
    })
}

// Publish the node's first ever node head in the network
// Note: this will not have a 'prev' link in the DAG object!
//
// @param {Anything} data
// @param {Object} node (nomad node object)
//
// @return {Promise} ipfs DAG object
//
const publishNodeRoot = (data, node) => {
  log.info(`${MODULE_NAME}: Publishing sensor root`)

  return initLatestNodeHead(data)
    .then(newDAG => publishLatestNodeHead(newDAG, node))
    .catch(error => Promise.reject({ PUBLISH_ROOT_ERROR: error }))
}

// Publish the latest sensor data to the network
//
// @param {Anything} data
// @param {Object} node (nomad node object)
//
// @return {Promise} ipfs DAG object
//
const publishNodeData = (data, node) => {
  log.info(`${MODULE_NAME}: Publishing sensor data`)

  if (!ipfsUtils.validDAGNode(node.head)) {
    node.head = ipfsUtils.createDAGNode(node.head)
  }

  return initLatestNodeHead(data)
    .then(newDAG => linkLatestNodeHeadToPrev(node.head, newDAG))
    .then(newDAG => publishLatestNodeHead(newDAG, node))
}

// API
//
module.exports = {
  publish: publishNodeData,
  publishRoot: publishNodeRoot,
}
