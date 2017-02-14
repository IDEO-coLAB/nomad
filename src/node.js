const R = require('ramda')
const path = require('path')
const IPFS = require('ipfs')
const PeerId = require('peer-id')
const PQueue = require('p-queue')

const promisifyIPFS = require('./utils/ipfs-promisify')
const log = require('./utils/log')
const publish = require('./publish')
const { SubscriptionsManager } = require('./subscribe')
const State = require('./local-state').StreamHead

const MODULE_NAME = 'NODE'

const queue = new PQueue({ concurrency: 1 })

/**
 * TODO:
 * - Better define config passing and init options
 * - Better / unified error handling within and across modules
 * - API call to get list of subscription ids.
 */

// // temporarily moved to ShimNode
// const DEFAULT_CONFIG = {
//   db: `${path.resolve(__dirname)}/.nomad-store`,
//   repo: `${path.resolve(__dirname)}/.ipfs-store`,
//   ipfs: { emptyRepo: true, bits: 2048 }
// }



const SIGNAL_SERVER_IP = '138.197.196.251'
const SIGNAL_SERVER_PORT = '10000'

// helper function to construct multiaddress strings
const multiAddrString = (ip, port, peerId) => {
  return `/libp2p-webrtc-star/ip4/${ip}/tcp/${port}/ws/ipfs/${peerId}`
}

const ipfsDefaultConfig = require('./config/ipfs-default-config.json')









/**
 * Class: Node
 */
module.exports = class Node {
  /**
   * Node Constructor
   *
   * @param {Object} config
   * @returns {Node}
   */
  constructor (config = DEFAULT_CONFIG) {
    this._ipfsConfig = config

    // let base = new IPFS(config.repo)
    // let overloaded = overloadIPFS(base)
    // this._ipfs = promisifyIPFS(overloaded)
    this._ipfs = promisifyIPFS(new IPFS(config.repo))

    this._publish = publish(this)
    this._subscriptionsManager = new SubscriptionsManager(this)

    this.identity = null
    // TODO: figure out the naming and api here, this is an initial job for tests
    this.heads = new State({ filePath: config.db })
  }

  /**
   * Bring the node online
   *
   * @returns {Promise} resolves with the node's identity
   */
  start (privKey) {

    let ipfsConfig = JSON.parse(JSON.stringify(ipfsDefaultConfig))

    const updateConfig = (id) => {
      // Set identity
      const pId = id.toJSON()
      ipfsConfig.Identity.PeerID = pId.id
      ipfsConfig.Identity.PrivKey = pId.privKey

      // Set the webRTC address
      // const ssConfig = JSON.parse(JSON.stringify(signalServerConfig))
      const webRTCAddr = multiAddrString(SIGNAL_SERVER_IP, SIGNAL_SERVER_PORT, pId.id)
      ipfsConfig.Addresses.Swarm = ipfsConfig.Addresses.Swarm.concat([ webRTCAddr ])

      // createFromJSON
      return ipfsConfig
    }




    return this._ipfs.initP(this._ipfsConfig.ipfs)


      .then((config) => {
        return new Promise((resolve, reject) => {
          this._ipfs._repo.config.get((err, config) => {
            if (err) {
              return reject(err)
            }
            // console.log('GOT THE CONFIG', config)
            return resolve()
          })
        })
      })

      .then(() => {
        if (privKey) {
          return new Promise((resolve, reject) => {
            PeerId.createFromPrivKey(privKey, (err, id) => {
              if (err) {
                return reject(err)
              }
              // console.log('CREATED __WITH__ PRIV KEY')
              return resolve(updateConfig(id))
            })
          })
        }

        return new Promise((resolve, reject) => {
          PeerId.create(this._ipfsConfig.ipfs, (err, id) => {
            if (err) {
              return reject(err)
            }
            // console.log('CREATED WITHOUT PRIV KEY')
            return resolve(updateConfig(id))
          })
        })
      })

      .then((config) => {
        return new Promise((resolve, reject) => {
          this._ipfs._repo.config.set(config, (err) => {
            if (err) {
              return reject(err)
            }
            // console.log('===============\n\n\n\n\n================')
            // console.log('SET THE CONFIG', config)
            return resolve()
          })
        })
      })




      .then(this._ipfs._loadP)
      .then(this._ipfs.goOnlineP)
      .then(this._ipfs.id)
      .then((id) => {
        this.identity = id
        log.info(`${MODULE_NAME}: Started ${this.identity.id}`)
        return this
      })
  }

  /**
   * Take the node offline
   *
   * @returns {Promise} resolves with the node's identity
   */
  stop () {
    log.info(`${MODULE_NAME}: Stopped ${this.identity.id}`)
    return this._ipfs.goOfflineP()
  }

  /**
   * Check if the node is online
   *
   * @returns {Bool}
   */
  isOnline () {
    return this._ipfs.isOnline()
  }

  /**
   * Publish data for the node
   *
   * @param {Buffer|String|Obj} data
   * @returns {Promise} resolves with the newly published head's hash
   */
  publish (data) {
    if (R.isNil(data)) {
      throw new Error('Publish requires a data argument')
    }
    return queue.add(() => this._publish(this.identity.id, data))
  }

  /**
   * Subscribe a handler be triggered when new events come in from a list of ids
   *
   * @param {Array} ids
   * @param {Function} handler
   */
  subscribe (ids, handler) {
    // ids not passed
    if (R.isNil(ids) || typeof ids === 'function' || !R.isArrayLike(ids)) {
      throw new Error(`'ids' must be an array`)
    }
    // ids empty
    if (R.isEmpty(ids)) {
      throw new Error(`'ids' must contain at least one id`)
    }
    // handler is not a function
    if (typeof handler !== 'function') {
      throw new Error(`'handler' must be a function`)
    }

    log.info(`${MODULE_NAME}: ${this.identity.id} subscribe to ${ids.join(', ')}`)

    // FIXME, TODO: what behavior do we want here when resubscribing
    // ids.filter((id) => !this.subscriptions.has(id))
    //   .forEach((id) => {
    //     this._subscriptionsManager.subscribe(id, handler)
    //   })
    ids.forEach((id) => {
      this._subscriptionsManager.subscribe(id, handler)
    })
  }

  /**
   * Unsubscribe from an id
   *
   * @param {String} id
   * @param {Function} handler
   */
  unsubscribe (id) {
    log.info(`${MODULE_NAME}: ${this.identity.id} unsubscribe from ${id}`)
    this._subscriptionsManager.unsubscribe(id)
  }
}
