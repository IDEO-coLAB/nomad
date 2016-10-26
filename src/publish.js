const fs = require('fs')
const R = require('ramda')

const log = require('./utils/log')
const config = require('./utils/config')
const ipfsUtils = require('./utils/ipfs')
const errors = require('./utils/errors')

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

      log.info(`${MODULE_NAME}: Adding data link to new sensor head`)

      return ipfsUtils.object.link(dataDAG.node, emptyDAG, 'data')
    })
}

// Link the previous sensor head to the new sensor head
const linkNewNodeHeadToPrev = (sourceDAG, targetDAG) => {
  const linkName = 'prev'
  log.info(`${MODULE_NAME}: Adding prev link to new sensor head`)

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
    // .catch(error => {
    //   log.err(`${MODULE_NAME}: ${error}`)
    //   const errorObj = new NomadError(error)
    //   log.err(errorObj.toErrorString())
    //   return Promise.reject(errorObj)
    // })
}

// Set the local sensor head from disk on node bootup
// FIXME, move to node.js as class method
const setHead = (node) => {
  log.info(`${MODULE_NAME}: Reading sensor head from disk on boot up`)

  const buffer = fs.readFileSync(NODE_HEAD_PATH)
  const curNodeHead = JSON.parse(buffer.toString())
  node.head = curNodeHead
}

// API

module.exports = {
  publish: publishNodeData,
  publishRoot: publishNodeRoot,
  setHead,
}
