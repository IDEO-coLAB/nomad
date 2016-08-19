const bs58 = require('bs58')
const ipfsApi = require('ipfs-api')
const R = require('ramda')

const ipfs = ipfsApi()

module.exports.bufferFromBase58 = (str) => {
  return new Buffer(bs58.decode(str))
}

module.exports.extractMultihashFromPath = (path) => {
  return R.replace('\/ipfs\/', '', path)
}

module.exports.getDAGObjectFromDAGPath = (DAGPath) => {
  return ipfs.object.get(module.exports.bufferFromBase58(module.exports.extractMultihashFromPath(DAGPath)))
}

// module.exports.getDAGDataFromBuffer = (buffer) => {

// }

module.exports.addDataToIPFS = (string) => {
  if (R.type(string) !== 'String') {
    string = JSON.stringify(string)
  }
  return ipfs.add(new Buffer(string, 'utf8'))
}

module.exports.createIpfsHashForNewData = (string) => {
  if (R.type(string) !== 'String') {
    string = JSON.stringify(string)
  }
  return ipfs.add(new Buffer(string, 'utf8'))
}
