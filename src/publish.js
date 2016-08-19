const ipfsApi = require('ipfs-api')
const R = require('ramda')
const { DAGLink } = require('ipfs-merkle-dag')

const log = require('./log')
const utils = require('./utils')

const ipfs = ipfsApi()

module.exports.sync = (node) => {
  // TODO: how do we handle if node has no head? let's not error - may be first time publishing
  return ipfs.name.resolve(node.identity.ID)
    .then((head) => {
      log('Resolved to current object head:', head.Path)
      node.currentDAG.path = head.Path // currently an /ipfs/ object (not ipns)
      return utils.getDAGObjectFromDAGPath(node.currentDAG.path)
    })
    .then((headData) => {
      node.currentDAG.data = headData
      log('Node currentDAG set!')
      return node
    })
    .catch((error) => {
      return Promise.reject({ customSyncError: error })
    })
}

module.exports.publish = (data, node) => {
  log('Minting new object for the next node head...')
  log('Adding data to IPFS to get a data hash...')

  return Promise.all([ ipfs.object.new(), utils.addDataToIPFS(data) ])
    .then((results) => {
      log('Minted new object and got a new data hash!')
      log('Adding "data" link to next node head...')

      const nextContainerObject = results[0]
      const newFile = R.head(results[1]) // Note: adding a new file returns an array
      const linkToFile = new DAGLink(
        'data',
        newFile.node.data.Size,
        utils.bufferFromBase58(utils.extractMultihashFromPath(newFile.path))
      )
      return ipfs.object.patch.addLink(utils.bufferFromBase58(nextContainerObject.toJSON().Hash), linkToFile)
    })
    .then((nodeWithNewData) => {
      log('Added "data" link!')
      log('Adding "prev" link to next node head...')

      const updatedNextContainerHash = nodeWithNewData.toJSON().Hash
      const linkToPrev = new DAGLink(
        'prev',
        node.currentDAG.data.Size,
        utils.bufferFromBase58(utils.extractMultihashFromPath(node.currentDAG.path))
      )
      return ipfs.object.patch.addLink(utils.bufferFromBase58(updatedNextContainerHash), linkToPrev)
    })
    .then(ipfs.object.put)
    .then((newHead) => {
      log('Created new node head with links!')
      log('Publishing new node head...')

      node.currentDAG = Object.assign({}, node.currentDAG, { data: newHead })
      return ipfs.name.publish(newHead.toJSON().Hash)
    })
    .then((newNodeHead) => {
      const path = `/ipfs/${newNodeHead.Value}`
      log('Published new node head. New head object can be found at ', path)

      node.currentDAG = Object.assign({}, node.currentDAG, { path })
      return node
    })
    .catch((error) => {
      return Promise.reject({ publishSyncError: error })
    })
}
