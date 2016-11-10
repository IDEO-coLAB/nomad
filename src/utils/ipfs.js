const bs58 = require('bs58')
const ipfsApi = require('ipfs-api')
const R = require('ramda')
const streamToPromise = require('stream-to-promise')
const { DAGLink, DAGNode } = require('ipfs-merkle-dag')

const log = require('./log')
const { NomadError, IPFSErrorDaemonOffline } = require('./errors')

const ipfs = ipfsApi()

const MODULE_NAME = 'IPFS'

// General Utils
const bufferFromBase58 = str => new Buffer(bs58.decode(str))
const base58FromBuffer = bs58.encode

const extractMultihashFromPath = path => R.replace('/ipfs/', '', path)

const IPFSConnectionRefusedErrorCode = 'ECONNREFUSED'

// replaces or passes through certain errors
const mapError = (err) => {
  let newError

  switch (err.code) {
    case IPFSConnectionRefusedErrorCode:
      newError = new IPFSErrorDaemonOffline()
      log.err(`${MODULE_NAME}: ${newError.toErrorString()}`)
      return Promise.reject(newError)
    default:
      log.err(`${MODULE_NAME}: Unhandled IPFS error: ${err.message}`)
      return Promise.reject(err)
  }
}

// Create a valid DAGNode from an object
//
// @param {Object} obj
//
// @return {Object} DAGNode
//
const createDAGNode = obj => {
  // TODO: sanity check object properties!!
  // obj is a stringified DAGNode object, not the class instance yet,
  // but this explains the capitalization for property access
  return new DAGNode(obj.Data, obj.Links)
}

// Check if an object is a valid DAGNode
//
// @param {Object} obj
//
// @return {Bool}
//
const validDAGNode = (obj) => {
  if (obj instanceof DAGNode) {
    return true
  }
  return false
}

// ID Utils
const id = () => {
  // log.info(`${MODULE_NAME}: Checking connection to network`)
  return ipfs.id().catch(mapError)
}

// Data Utils
const data = {
  add: (value) => {
    // log.info(`${MODULE_NAME}: Getting a hash for newly added data`)
    return ipfs.add(new Buffer(value, 'utf8')).catch(mapError)
  },
}

// Name Utils
const name = {
  resolve: (hash) => {
    // log.info(`${MODULE_NAME}: Resolving hash ${hash}`)
    return ipfs.name.resolve(hash).catch(mapError)
  },

  publish: (dag) => {
    const hash = dag.toJSON().Hash
    // log.info(`${MODULE_NAME}: Publishing ${hash} via IPNS`)
    return ipfs.name.publish(hash)
      .then((res) => {
        // log.info(`${MODULE_NAME}: Successfully published via IPNS`)
        return Promise.resolve(res)
      })
      .catch(mapError)
  },
}

// Object Utils
const object = {
  // Currently expect lookup to be a DAG path...generify this
  // TODO: abstract!
  get: (lookup) => {
    // log.info(`${MODULE_NAME}: Getting object ${lookup}`)
    return ipfs.object.get(bufferFromBase58(extractMultihashFromPath(lookup))).catch(mapError)
  },

  // Currently expect lookup to be a DAG path...generify this
  // TODO: abstract!
  data: (lookup) => {
    // log.info(`${MODULE_NAME}: Getting object data for ${lookup}`)
    return ipfs.object.data(bufferFromBase58(extractMultihashFromPath(lookup))).catch(mapError)
  },

  put: (dag) => {
    // log.info(`${MODULE_NAME}: Putting a DAG object`)
    return ipfs.object.put(dag).catch(mapError)
  },

  create: () => {
    // log.info(`${MODULE_NAME}: Creating a new DAG object`)
    return ipfs.object.new().catch(mapError)
  },

  link: (sourceDAG, targetDAG, linkName) => {
    // log.info(`${MODULE_NAME}: Adding '${linkName}' link to an object`)

    if (R.isNil(sourceDAG)) {
      return Promise.reject(new NomadError('MODULE_NAME: sourceDAG was null'))
    }

    if (R.isNil(targetDAG)) {
      return Promise.reject(new NomadError('MODULE_NAME: targetDAG was null'))
    }

    const sourceHash = sourceDAG.toJSON().Hash
    const targetHash = targetDAG.toJSON().Hash

    const sourceDataSize = sourceDAG.data ? sourceDAG.data.Size : 0
    const newLink = new DAGLink(
      linkName,
      sourceDataSize,
      bufferFromBase58(sourceHash)
    )

    return ipfs.object.patch.addLink(bufferFromBase58(targetHash), newLink).catch(mapError)
  },

  // Currently expect DAG hash
  cat: (lookup) => {
    // log.info(`${MODULE_NAME}: Cat-ing ${lookup}`)
    return ipfs.cat(lookup)
      .then(readStream => streamToPromise(readStream))
      .then(buffer => buffer.toString())
      .catch(mapError)
  },
}

// Extract a named link from a specified object (data || prev)
//
// @param {String} hash (b58 ipfs object hash)
// @param {String} linkName (optional)
//
// @return {Promise}
//
const extractLinkFromIpfsObject = (hash, linkName = 'data') => {
  // log.info(`${MODULE_NAME}: fetching data for object ${hash}`)

  return object.get(hash)
    .then((ipfsObj) => {
      const links = ipfsObj.links
      if (R.isNil(links)) {
        // log.info(`${MODULE_NAME}: Object is missing a links property`)
        throw new NomadError('Object is missing links property')
      }

      const linkData = R.find(R.propEq('name', linkName), links)
      if (R.isNil(linkData)) {
        // log.info(`${MODULE_NAME}: Object is missing a ${linkName} link`)
        throw new NomadError(`Object is missing a ${linkName} link`)
      }

      const encoded = base58FromBuffer(linkData.hash)
      return Promise.resolve(encoded)
    })
}

module.exports = {
  id,
  data,
  name,
  object,
  base58FromBuffer,
  extractMultihashFromPath,
  extractLinkFromIpfsObject,
  validDAGNode,
  createDAGNode,
}
