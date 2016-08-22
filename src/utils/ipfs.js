'use strict'

const bs58 = require('bs58')
const ipfsApi = require('ipfs-api')
const R = require('ramda')
const Q = require('q')
const { DAGLink } = require('ipfs-merkle-dag')
const { log, logError } = require('./log')

const ipfs = ipfsApi()

const MODULE_NAME = 'IPFS'

// General Utils
const bufferFromBase58 = (str) => new Buffer(bs58.decode(str))

const extractMultihashFromPath = (path) => R.replace('\/ipfs\/', '', path)

// ID Utils
const id = () => {
  log(`${MODULE_NAME}: Checking connection to network`)
  return ipfs.id()
    .catch((err) => {
      logError(`${MODULE_NAME}: Failed network connection`, err.message)
      return Promise.reject(err)
    })
}

// Data Utils
const data = {
  add: (data) => {
    log(`${MODULE_NAME}: Getting a hash for newly added data`)
    return ipfs.add(new Buffer(data, 'utf8'))
  }
}

// Name Utils
const name = {
  resolve: (id) => {
    log(`${MODULE_NAME}: Resolving hash ${id}`)
    return ipfs.name.resolve(id)
  },

  publish: (dag) => {
    const hash = dag.toJSON().Hash
    log(`${MODULE_NAME}: Publishing ${hash} via IPNS`)
    return ipfs.name.publish(hash)
  }
}

// Object Utils
const object = {
  // Currently expect lookup to be a DAG path...generify this
  // TODO: abstract!
  get: (lookup) => {
    log(`${MODULE_NAME}: Getting object ${lookup}`)
    return ipfs.object.get(bufferFromBase58(extractMultihashFromPath(lookup)))
  },

  // Currently expect lookup to be a <buffer>...generify this
  // TODO: abstract!
  data: (lookup) => {
    log(`${MODULE_NAME}: Getting object data for ${lookup}`)
    return ipfs.object.data(lookup)
  },

  put: (dag) => {
    log(`${MODULE_NAME}: Putting a DAG object`)
    return ipfs.object.put(dag)
  },

  create: () => {
    log(`${MODULE_NAME}: Creating a new DAG object`)
    return ipfs.object.new()
  },

  link: (sourceDAG, targetDAG, linkName) => {
    log(`${MODULE_NAME}: Adding '${linkName}' link to an object`)

    const sourceHash = sourceDAG.toJSON().Hash
    const targetHash = targetDAG.toJSON().Hash

    const sourceDataSize = sourceDAG.data ? sourceDAG.data.Size : 0
    const newLink = new DAGLink(
      linkName,
      sourceDataSize,
      bufferFromBase58(sourceHash)
    )

    return ipfs.object.patch.addLink(bufferFromBase58(targetHash), newLink)
  }
}

module.exports = { id, data, name, object }
