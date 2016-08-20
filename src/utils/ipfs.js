'use strict'

const bs58 = require('bs58')
const ipfsApi = require('ipfs-api')
const R = require('ramda')
const { DAGLink } = require('ipfs-merkle-dag')
const log = require('./log')

const ipfs = ipfsApi()

const bufferFromBase58 = (str) => {
  return new Buffer(bs58.decode(str))
}

const multihashFromPath = (path) => {
  return R.replace('\/ipfs\/', '', path)
}

const getDAGObjectFromDAGPath = (DAGPath) => {
  return ipfs.object.get(bufferFromBase58(multihashFromPath(DAGPath)))
}

const putObject = (dag) => {
  log('IPFS: Putting new ipfs object')
  return ipfs.object.put(dag)
}

const createObject = () => {
  log('IPFS: Creating new ipfs object')
  return ipfs.object.new()
}

const publishObject = (dag) => {
  log('IPFS: Publishing to IPNS')
  return ipfs.name.publish(dag.toJSON().Hash)
}

const addData = (data) => {
  log('IPFS: Adding new data object')
  let published = data
  if (R.type(data) !== 'String') {
    published = JSON.stringify(data)
  }
  return ipfs.add(new Buffer(published, 'utf8'))
}

const addLinkToObject = (sourceDAG, targetDAG, linkName) => {
  log('IPFS: Adding ' + linkName + ' link to a target DAG object')
  const newLink = new DAGLink(
    linkName,
    targetDAG.node.data.Size,
    bufferFromBase58(multihashFromPath(targetDAG.path))
  )
  return ipfs.object.patch.addLink(bufferFromBase58(sourceDAG.toJSON().Hash), newLink)
}

const resolve = (id) => {
  log('IPFS: Resolving: ', id)
  return ipfs.name.resolve(id)
}

module.exports = {
  addData,
  putObject,
  publishObject,
  createObject,
  addLinkToObject,
  resolve,
  getDAGObjectFromDAGPath
}