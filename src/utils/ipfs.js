const bs58 = require('bs58')
const ipfsApi = require('ipfs-api')
const R = require('ramda')
const streamToPromise = require('stream-to-promise')
const { DAGLink } = require('ipfs-merkle-dag')

const log = require('./log')
const errors = require('./errors')

const ipfs = ipfsApi()

const MODULE_NAME = 'IPFS'

// General Utils
const bufferFromBase58 = str => new Buffer(bs58.decode(str))
const base58FromBuffer = bs58.encode

const extractMultihashFromPath = path => R.replace('/ipfs/', '', path)

// ID Utils
const id = () => {
  log.info(`${MODULE_NAME}: Checking connection to network`)
  return ipfs.id()
    .catch((err) => {
      log.err(`${MODULE_NAME}: Failed network connection`, err.message)
      return Promise.reject(err)
    })
}

// Data Utils
const data = {
  add: (value) => {
    log.info(`${MODULE_NAME}: Getting a hash for newly added data`)
    return ipfs.add(new Buffer(value, 'utf8'))
  },
}

// Name Utils
const name = {
  resolve: (hash) => {
    log.info(`${MODULE_NAME}: Resolving hash ${hash}`)
    return ipfs.name.resolve(hash)
  },

  publish: (dag) => {
    const hash = dag.toJSON().Hash
    log.info(`${MODULE_NAME}: Publishing ${hash} via IPNS`)
    return ipfs.name.publish(hash)
  },
}

// Object Utils
const object = {
  // Currently expect lookup to be a DAG path...generify this
  // TODO: abstract!
  get: (lookup) => {
    log.info(`${MODULE_NAME}: Getting object ${lookup}`)
    return ipfs.object.get(bufferFromBase58(extractMultihashFromPath(lookup)))
  },

  // Currently expect lookup to be a DAG path...generify this
  // TODO: abstract!
  data: (lookup) => {
    log.info(`${MODULE_NAME}: Getting object data for ${lookup}`)
    return ipfs.object.data(bufferFromBase58(extractMultihashFromPath(lookup)))
  },

  put: (dag) => {
    log.info(`${MODULE_NAME}: Putting a DAG object`)
    return ipfs.object.put(dag)
  },

  create: () => {
    log.info(`${MODULE_NAME}: Creating a new DAG object`)
    return ipfs.object.new()
  },

  link: (sourceDAG, targetDAG, linkName) => {
    log.info(`${MODULE_NAME}: Adding '${linkName}' link to an object`)

    const sourceHash = sourceDAG.toJSON().Hash
    const targetHash = targetDAG.toJSON().Hash

    const sourceDataSize = sourceDAG.data ? sourceDAG.data.Size : 0
    const newLink = new DAGLink(
      linkName,
      sourceDataSize,
      bufferFromBase58(sourceHash)
    )

    return ipfs.object.patch.addLink(bufferFromBase58(targetHash), newLink)
  },

  // Currently expect DAG hash
  cat: (lookup) => {
    log.info(`${MODULE_NAME}: Cat-ing ${lookup}`)
    return ipfs.cat(lookup)
      .then(readStream => streamToPromise(readStream))
      .then(buffer => buffer.toString())
  },
}

module.exports = { id, data, name, object, base58FromBuffer }
