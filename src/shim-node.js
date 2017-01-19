const _ = require('underscore')
const fetch = require('isomorphic-fetch')
const Node = require('./node')
const log = require('./utils/log')
const path = require('path')
const promisify = require('es6-promisify')

const MODULE_NAME = 'SHIM-NODE'

const DEFAULT_CONFIG = {
  db: `${path.resolve(__dirname)}/.nomad-store`,
  repo: `${path.resolve(__dirname)}/.ipfs-store`,
  ipfs: { emptyRepo: true, bits: 2048 }
}

const SHIM_HOST = 'http://10.2.4.186:8000'
const SHIM_POST = `${SHIM_HOST}/connect`
const SHIM_GET = `${SHIM_HOST}/connect`

module.exports = class ShimNode extends Node {
  // Overrides of Node methods
  constructor (config = DEFAULT_CONFIG) {
    super(config)
    this.postShimServer = _.throttle(this.postShimServer, 10000)
  }

  stop () {
    // delete our peer from the shim server
    return super.stop()
  }

  publish (data) {
    this.postShimServer()
    return super.publish(data)
  }

  subscribe (ids, handler) {
    const id = ids[0]
    this.dial(id)
    .then(() => {
      debugger
    })
    .catch(err => {
      console.log(`err: ${err}`)
    })


    // get peer info from shim server and dial peer
    // super.subscribe(ids, handler)
  }

  // ShimNode only methods

  dial(peerId) {
    return this.getShimServer(peerId)
      .then(peerInfo => {
        console.log(`got ${peerInfo}`)
        const _dial = promisify(this._ipfs._libp2pNode.swarm.dial)
        debugger
        return _dial(peerInfo, '/floodsub/1.0.0')
      })
  }

  postShimServer() {
    setTimeout(() => {
      this._ipfs.swarm.localAddrs()
        .then((obj) => {
          debugger
        })
      }, 10000)
    
    // const thisPeerInfo = this._ipfs._libp2pNode.peerInfo
    console.log(thisPeerInfo)
    return fetch(SHIM_POST, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(thisPeerInfo)
    }).catch(err => {
      console.log(err)
      log.err(err)
    })
  }

  // returns peerInfo object
  getShimServer(peerId) {
    const url = `${SHIM_GET}?id=${peerId}`
    console.log(url)
    return fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    })
    .then(response => {
      return response.json()
    })
    .catch(err => {
      console.log(err)
      log.err(err)
    })
  }
}
