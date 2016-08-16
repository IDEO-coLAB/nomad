const R = require('ramda')
const bs58 = require('bs58')

const winston = require('winston')
const logger = new winston.Logger({
  transports: [ new winston.transports.Console({ colorize: true }) ]
})

const nomadConfig = require('./../nomad.config') // make this more dynamic?
const ipfsApi = require('ipfs-api')
const ipfs = ipfsApi()

let internalState = {
  config: null,
  ipfs: { connected: 0, data: null },
  sources: [ /* each object has same format { connected, data } */ ]
}

// Still lots of basic todos
// check to make sure sources are an array
// build initial source list?
const ensureNomadConfig = () => {
  if (!nomadConfig) return Promise.reject({ customErr: 'no config'})
  let newState = Object.assign({}, internalState)
  newState.config = nomadConfig
  internalState = newState
  return Promise.resolve(internalState)
}

// Ensure an ipfs daemon is running
// how to account for multiple strategies // firebase too?
const ensureIpfsConnection = () => {
  return ipfs.id()
    .then((data) => {
      let newState = Object.assign({}, internalState)
      newState.ipfs.connected = 1
      newState.ipfs.data = data
      internalState = newState
      return internalState
    })
    .catch((err) => {
      return Promise.reject({ customErr : err })
    })
}

// check to make sure sources are valid peer ids in an array?
// and other items for sanity checking
const connectToSources = (config) => {
  const { sources } = nomadConfig

  let potentialConnections = R.map((source) => {
    return ipfs.name.resolve(source)
      .then((data) => Promise.resolve({ source, data }))
      .catch((error) => Promise.resolve({ source, error: error.message }))
  }, sources)

  return Promise.all(potentialConnections)
    .then((data) => {
      let newState = Object.assign({}, internalState)
      newState.sources = R.map((d) => {
        return {
          data: d,
          connected: d.error ? 0 : 1,
        }
      }, data)
      internalState = newState
      return internalState
    })
}

// API
exports.connect = () => {
  return ensureNomadConfig()
    .then(ensureIpfsConnection)
    .then(connectToSources)
}

exports.publish = () => {

}
