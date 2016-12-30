const bs58 = require('bs58')
const IPFS = require('ipfs')
const R = require('ramda')

// const log = require('./log')

exports = module.exports

const MODULE_NAME = 'IPFS'

let instance

const ensureInstance = () => {
  if (!instance) {
    throw new Error('No IPFS instance')
  }
}

exports.init = (config) => {
  instance = new IPFS(config.repo)
  return new Promise((resolve, reject) => {
    instance.init(config.ipfs, (err) => {
      if (err) {
        throw err
      }
      resolve()
    })
  })
}

exports.load = () => {
  ensureInstance()
  return new Promise((resolve, reject) => {
    return instance.load((err) => {
      if (err) {
        return reject(err)
      }
      resolve()
    })
  })
}

exports.goOnline = () => {
  ensureInstance()
  return new Promise((resolve, reject) => {
    instance.goOnline((err) => {
      if (err) {
        return reject(err)
      }
      resolve()
    })
  })
}

exports.goOffline = () => {
  ensureInstance()
  return new Promise((resolve, reject) => {
    instance.goOffline((err) => {
      if (err) {
        return reject(err)
      }
      resolve()
    })
  })
}

exports.isOnline = () => {
  ensureInstance()
  return instance.isOnline()
}

exports.id = () => {
  ensureInstance()
  return instance.id()
}

exports.publish = (data) => {
  ensureInstance()
  return instance.pubsub.publish(data)
}

exports.object = {}

exports.object.put = (dag) => {
  ensureInstance()
  return instance.object.put(dag)
}

exports.object.new = () => {
  ensureInstance()
  return instance.object.new()
}

exports.object.addLink = (hash, DAGLink) => {
  ensureInstance()
  return instance.object.patch.addLink(hash, DAGLink)
}

exports.object.get = (hash) => {
  ensureInstance()
  // const cid = new CID(hash)
  // return instance.object.get(cid.multihash)
  console.log('getting in object.get', hash)
  return instance.object.get(hash, { enc: 'base58' })
}

exports.pubsub = {}

exports.pubsub.pub = (topic, data) => {
  ensureInstance()
  return instance.pubsub.publish(topic, data)
}

exports.files = {}

exports.files.add = (data) => {
  ensureInstance()
  return instance.files.add(data)
}
