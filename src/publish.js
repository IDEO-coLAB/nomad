'use strict'

const R = require('ramda')
const { log, logError } = require('./utils/log')
const constants = require('./utils/constants')
const network = require('./utils/network')
const ipfsUtils = require('./utils/ipfs')

const MODULE_NAME = 'PUBLISH'




const initNewSensorHead = (data) => {
  log(`${MODULE_NAME}: Initializing a new sensor head`)

  return Promise.all([ ipfsUtils.object.create(), ipfsUtils.data.add(data) ])
    .then((results) => {
      const emptyDAG = R.head(results)
      const dataDAG = R.head(R.last(results))
      const linkName = `data`

      log(`${MODULE_NAME}: Adding ${linkName} link to new sensor head`)

      return ipfsUtils.object.link(emptyDAG, dataDAG, 'data')
    })
}

const linkNewSensorHeadToPrev = (sourceDAG, targetDAG) => {
  const linkName = `prev`
  log(`${MODULE_NAME}: Adding ${linkName} link to new sensor head`)

  return ipfsUtils.object.link(sourceDAG, targetDAG, linkName)
}

const publishNewSensorHead = (dag, node) => {
  log(`${MODULE_NAME}: Publishing new sensor head`)

  return ipfsUtils.object.put(dag)
    .then((putDAG) => {
      node.current = Object.assign({}, node.current, { data: putDAG })
      console.log(putDAG.toJSON())
      console.log(putDAG)

      return ipfsUtils.object.publish(putDAG)
    })
    .then((publishedDAG) => {
      node.current = Object.assign({}, node.current, { path: `/ipfs/${publishedDAG.Value}` })
      return node
    })
}




const resolveSensorHead = (node) => {
  log(`${MODULE_NAME}: Resolving sensor head`)

  const id = node.identity.ID


  // REWORK THIS
  // REWORK THIS
  // REWORK THIS
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
    // REWORK THIS
    // REWORK THIS
    // REWORK THIS
}





const publishSensorRoot = (data, node) => {
  log(`${MODULE_NAME}: Publishing sensor root`)

  return initNewSensorHead(data)
    .then((newDAG) => publishNewSensorHead(newDAG, node))
    .catch((error) => Promise.reject({ PUBLISH_ROOT_ERROR: error }))
}

const publishSensorData = (data, node) => {
  log(`${MODULE_NAME}: Publishing sensor data`)

  return initNewSensorHead(data)
    .then((newDAG) => linkNewSensorHeadToPrev(newDAG, node.current))
    .then((newDAG) => publishNewSensorHead(newDAG, node))
    .catch((error) => Promise.reject({ PUBLISH_ERROR: error }))
}

const syncSensorHead = (node) => {
  log(`${MODULE_NAME}: Syncing with current sensor head`)

  return resolveSensorHead(node)
    .then((head) => {
      log('PUBLISH: Resolved to current object head:', head.Path)
      node.current.path = head.Path // currently an /ipfs/ object (not ipns)
      return ipfsUtils.object.get(node.current.path)
    })
    .then((headData) => {
      log('PUBLISH: Set the currentDAG for the node')
      node.current.node = headData
      return node
    })
    .catch((error) => {
      return Promise.reject({ customSyncError: error })
    })
}

module.exports = {
  sync: syncSensorHead,
  publish: publishSensorData
}







