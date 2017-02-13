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
// const DEFAULT_STORES = {
//   db: `${path.resolve(__dirname)}/.nomad-store`,
//   repo: `${path.resolve(__dirname)}/.ipfs-store`,
//   ipfs: { emptyRepo: true, bits: 2048 }
// }



// const SIGNAL_SERVER_IP = '138.197.196.251'
// const SIGNAL_SERVER_PORT = '10000'

// // helper function to construct multiaddress strings
// const multiAddrString = (ip, port, peerId) => {
//   return `/libp2p-webrtc-star/ip4/${ip}/tcp/${port}/ws/ipfs/${peerId}`
// }








const ipfsDefaultConfig = require('./config/ipfs-config.json')

const sigServConfig = require('./config/signal-server-config.json')
const { webRTCMultiAddr } = require('./utils/ipfs-strings')













/**
 * Class: Node
 */
module.exports = class Node {
  /**
   * Node Constructor
   *
   * @param {Object} stores
   * @returns {Node}
   */
  constructor (stores = DEFAULT_STORES) {
    this._stores = stores
    this._ipfs = promisifyIPFS(new IPFS(stores.repo))

    this._publish = publish(this)
    this._subscriptionsManager = new SubscriptionsManager(this)

    this.identity = null
    // TODO: figure out the naming and api here, this is an initial job for tests
    this.heads = new State({ filePath: stores.db })
  }



  configure (opts) {
    const ipfsInitOpts = { emptyRepo: true, bits: 2048 }

    const config = opts.config || JSON.parse(JSON.stringify(ipfsDefaultConfig))
    const privKey = opts.privKey || null

    const configureIPFS = (id) => {
      let newConfig = Object.assign({}, config)

      // Set identity
      const peerId = id.toJSON()
      newConfig.Identity.PeerID = peerId.id
      newConfig.Identity.PrivKey = peerId.privKey

      // Set the webRTC address
      const webRTCAddr = webRTCMultiAddr(sigServConfig.IP, sigServConfig.port, peerId.id)
      newConfig.Addresses.Swarm = newConfig.Addresses.Swarm.concat([ webRTCAddr ])

      return newConfig
    }

    return this._ipfs.initP(ipfsInitOpts)
      .then(() => {
        if (privKey) {
          return new Promise((resolve, reject) => {
            PeerId.createFromPrivKey(privKey, (err, id) => {
              if (err) {
                return reject(err)
              }
              return resolve(configureIPFS(id))
            })
          })
        }

        return new Promise((resolve, reject) => {
          PeerId.create(ipfsInitOpts, (err, id) => {
            if (err) {
              return reject(err)
            }
            return resolve(configureIPFS(id))
          })
        })
      })
      .then(() => {
        return new Promise((resolve, reject) => {
          this._ipfs._repo.config.set(config, (err) => {
            if (err) {
              return reject(err)
            }
            return resolve()
          })
        })
      })




  }




  /**
   * Bring the node online
   *
   * @returns {Promise} resolves with the node's identity
   */
  start () {
    return this._ipfs.loadP()
      .then(this._ipfs.goOnlineP)
      .then(this._ipfs.id)
      .then((id) => {
        this.identity = id
        log.info(`${MODULE_NAME}: Started ${this.identity.id}`)
        return this
      })





    // const emptyIpfsOpts = { emptyRepo: true, bits: 2048 }

    // let ipfsConfig = JSON.parse(JSON.stringify(ipfsDefaultConfig))

    // const updateConfig = (id) => {
    //   // Set identity
    //   const pId = id.toJSON()
    //   ipfsConfig.Identity.PeerID = pId.id
    //   ipfsConfig.Identity.PrivKey = pId.privKey

    //   // Set the webRTC address
    //   // const ssConfig = JSON.parse(JSON.stringify(signalServerConfig))
    //   const webRTCAddr = multiAddrString(SIGNAL_SERVER_IP, SIGNAL_SERVER_PORT, pId.id)
    //   ipfsConfig.Addresses.Swarm = ipfsConfig.Addresses.Swarm.concat([ webRTCAddr ])

    //   // createFromJSON
    //   return ipfsConfig
    // }




    // return this._ipfs.initP(this._config.ipfs)


    //   .then(() => {
    //     return new Promise((resolve, reject) => {
    //       this._ipfs._repo.config.get((err, config) => {
    //         if (err) {
    //           return reject(err)
    //         }
    //         return resolve()
    //       })
    //     })
    //   })

    //   .then(() => {
    //     if (privKey) {
    //       return new Promise((resolve, reject) => {
    //         PeerId.createFromPrivKey(privKey, (err, id) => {
    //           if (err) {
    //             return reject(err)
    //           }
    //           return resolve(updateConfig(id))
    //         })
    //       })
    //     }

    //     return new Promise((resolve, reject) => {
    //       PeerId.create(this._config.ipfs, (err, id) => {
    //         if (err) {
    //           return reject(err)
    //         }
    //         return resolve(updateConfig(id))
    //       })
    //     })
    //   })

    //   .then(() => {
    //     return new Promise((resolve, reject) => {
    //       this._ipfs._repo.config.set(config, (err) => {
    //         if (err) {
    //           return reject(err)
    //         }
    //         return resolve()
    //       })
    //     })
    //   })




      // .then(this._ipfs._loadP)

    // return this._ipfs._loadP()
    //   .then(this._ipfs.goOnlineP)
    //   .then(this._ipfs.id)
    //   .then((id) => {
    //     this.identity = id
    //     log.info(`${MODULE_NAME}: Started ${this.identity.id}`)
    //     return this
    //   })
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
