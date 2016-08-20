// 'use strict'

// const bs58 = require('bs58')
// const ipfsApi = require('ipfs-api')
// const R = require('ramda')

// const config = require('./../nomad.config')

// const ipfs = ipfsApi()

// const atomic = function checkAtomicity() {
//   const subs = config.subscriptions
//   if (!subs) return true
//   if (!R.isArrayLike(subs)) throw new Error('Config subscriptions must be an <Array>')
//   if (R.isEmpty(subs)) return true
//   return false
// }()

// const bufferFromBase58 = (str) => {
//   return new Buffer(bs58.decode(str))
// }

// const multihashFromPath = (path) => {
//   return R.replace('\/ipfs\/', '', path)
// }

// const getDAGObjectFromDAGPath = (DAGPath) => {
//   return ipfs.object.get(bufferFromBase58(multihashFromPath(DAGPath)))
// }


// const getDAGObjectDataFromBuffer = (buffer) => {
//   return ipfs.object.data(buffer)
// }

// const addDataToIPFS = (string) => {
//   if (R.type(string) !== 'String') {
//     string = JSON.stringify(string)
//   }
//   return ipfs.add(new Buffer(string, 'utf8'))
// }

// const createIpfsHashForNewData = (string) => {
//   if (R.type(string) !== 'String') {
//     string = JSON.stringify(string)
//   }
//   return ipfs.add(new Buffer(string, 'utf8'))
// }












// module.exports = {
//   atomic,

//   bufferFromBase58,
//   multihashFromPath,

//   getDAGObjectFromDAGPath,
//   getDAGObjectDataFromBuffer,

//   addDataToIPFS,
//   createIpfsHashForNewData
// }