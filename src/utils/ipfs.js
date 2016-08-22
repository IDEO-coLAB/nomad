'use strict'

const bs58 = require('bs58')
const ipfsApi = require('ipfs-api')
const R = require('ramda')
const Q = require('q')
const { DAGLink } = require('ipfs-merkle-dag')
const { log, logWarn } = require('./log')

const ipfs = ipfsApi()

const MODULE_NAME = 'IPFS'

// General Utils
const bufferFromBase58 = (str) => new Buffer(bs58.decode(str))

const multihashFromPath = (path) => R.replace('\/ipfs\/', '', path)

// ID Utils
const id = () => {
  log(`${MODULE_NAME}: Checking connection to network`)
  return ipfs.id()
}

// Data Utils
const data = {
  add: (data) => {
    log(`${MODULE_NAME}: Getting a hash for newly added data`)

    let published = data
    if (R.type(data) !== 'String') {
      published = JSON.stringify(data)
    }

    return ipfs.add(new Buffer(published, 'utf8'))
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
    log(`${MODULE_NAME}: Publishing ${hash} to IPNS`)
    return ipfs.name.publish(hash)
  }
}

// Object Utils
const object = {
  // Currently expect lookup to be a DAG path...generify this
  // TODO: abstract!
  get: (lookup) => {
    log(`${MODULE_NAME}: Getting object ${lookup}`)
    return ipfs.object.get(bufferFromBase58(multihashFromPath(lookup)))
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
    log(`${MODULE_NAME}: Adding ${linkName} to an object`)

    const sourceHash = sourceDAG.toJSON().Hash
    const targetHash = targetDAG.toJSON().Hash


    const targetDataSize = targetDAG.data ? targetDAG.data.Size : 0
    // TODO: try catch
    const newLink = new DAGLink(
      linkName,
      targetDataSize,
      bufferFromBase58(targetHash)
    )

    return ipfs.object.patch.addLink(bufferFromBase58(sourceHash), newLink)
  }
}

module.exports = { id, data, name, object }
