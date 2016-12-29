const fs = require('fs')
const R = require('ramda')

const log = require('./utils/log')
const config = require('./utils/config')
const ipfsUtils = require('./utils/ipfs')
const ipfs = require('./utils/ipfs')

const { getHeadForStream, setHeadForStream } = require('./local-state')

/**
 * TODO:
 * - local-state should store entire DAG objects to avoid ipfs lookups
 * - make broadcastAndStore 'atomic' even at a basic level
 */

const MODULE_NAME = 'PUBLISH'

exports = module.exports

/**
 * Create a new publishing head object with the appropriate 'data' link
 *
 * @param {Buffer} buf
 * @returns {Promise} resolves with the newly added DAG object
 */
const createHead = (buf) => {
  return Promise.all([
    ipfs.dag.create(),
    ipfs.dag.create(buf)
  ])
  .then((results) => {
    const rootDAG = results[0]
    const linkDAG = results[1]

    const link = linkDAG.toJSON()
    link.name = 'data'

    return ipfs.dag.addLink(rootDAG, link)
  })
  .then(ipfs.object.put)
}

/**
 * Broadcast new data to subscribers; store the new head locally
 * Note: this will eventually act as an 'atomic action'
 *
 * @param {Buffer|Object} data
 * @param {String} id
 * @returns {Promise} resolves with the newly published head's hash
 */
const broadcastAndStore = (id, dag) => {
  log.info(`${MODULE_NAME}: Broadcasting and storing ${dag.toJSON().multihash}`)

  const mhBuf = new Buffer(dag.toJSON().multihash)

  return ipfs.pubsub.pub(id, mhBuf)
    .then(() => {
      return setHeadForStream(id, dag.toJSON().multihash)
    })
    // TODO: catch might handle 'rollbacks' in early versions
}

/**
 * Publish a new root for a specified id
 * Warning: This entirely resets the published history
 *
 * @param {String} id
 * @param {Buffer} buf
 * @returns {Promise} resolves with the newly published head's hash
 */
const publishRoot = (id, buf) => {
  log.info(`${MODULE_NAME}: Publishing new root`)
  return createHead(buf)
    .then((dag) => broadcastAndStore(id, dag))
}

/**
 * Publish new data for a specified id
 * Warning: This entirely resets the published history
 *
 * @param {String} id
 * @param {Buffer} buf
 * @returns {Promise} resolves with the newly published head's hash
 */
const publishData = (id, buf) => {
  log.info(`${MODULE_NAME}: Publishing new data`)

  let oldHeadDAG

  return createHead(buf)
    .then((dag) => {
      oldHeadDAG = dag
      const prevHash = getHeadForStream(id)
      return ipfs.object.get(prevHash) // avoid this lookup by storing whole DAG
    })
    .then((dag) => {
      const prevJSON = dag.toJSON()
      prevJSON.name = 'prev'
      return ipfs.dag.addLink(oldHeadDAG, prevJSON)
    })
    .then(ipfs.object.put)
    .then((dag) => broadcastAndStore(id, dag))
}

/**
 * Publish data for a specified id
 *
 * @param {String} id
 * @param {Buffer|Object} data
 * @returns {Promise} resolves with the newly published head's hash
 */
exports.publish = (id, data) => {
  let dataBuf = data
  if (!Buffer.isBuffer(dataBuf)) {
    dataBuf = new Buffer(dataBuf)
  }

  // TODO: ensure getHeadForStream is efficient in its lookups
  // or store something locally once publish happens and refer here first
  if (getHeadForStream(id)) {
    return publishData(id, dataBuf)
  }
  return publishRoot(id, dataBuf)
}
