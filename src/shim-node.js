// const _ = require('underscore')
const fetch = require('isomorphic-fetch')
const path = require('path')
const PeerInfo = require('peer-info')
const PeerId = require('peer-id')
const promisify = require('es6-promisify')

const Node = require('./node')
const log = require('./utils/log')

const MODULE_NAME = 'SHIM-NODE'

const PROTOCOL_FLOODSUB = '/floodsub/1.0.0'

const SHIM_HOST = 'http://10.2.2.106:8000'
const SHIM_POST = `${SHIM_HOST}/connect`
const SHIM_GET = `${SHIM_HOST}/connect`
const SHIM_DELETE = `${SHIM_HOST}/connect`

const DEFAULT_CONFIG = {
  db: `${path.resolve(__dirname)}/.nomad-store`,
  repo: `${path.resolve(__dirname)}/.ipfs-store`,
  ipfs: { emptyRepo: true, bits: 2048 }
}

module.exports = class ShimNode extends Node {
  // Overrides of Node methods
  constructor (config = DEFAULT_CONFIG) {
    super(config)
    // track if the node had registered itself with the shim server
    this.registered = false
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





  stop () {
    return this.deleteShimServer(this.identity.id)
      .then(() => super.stop())
  }

  publish (data) {
    if (this.registered) {
      return super.publish(data)
    }
    return this.postShimServer()
      .then(() => super.publish(data))
  }

  dial(peerId) {
    return this.getShimServer(peerId)
      .then(peerInfo => {
        const dialP = promisify(this._ipfs._libp2pNode.swarm.dial)
        return dialP(peerInfo, PROTOCOL_FLOODSUB)
      })
  }

  postShimServer() {
    const peerInfo = this._ipfs._libp2pNode.peerInfo
    const body = {
      id: peerInfo.id.toB58String(),
      multiaddrs: peerInfo.multiaddrs.map((mAddr) => mAddr.toString())
    }

    return fetch(SHIM_POST, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    })
    .then((data) => {
      this.registered = true  // flip the registration flag
      return data
    })
  }

  getShimServer(peerId) {
    const getUrl = `${SHIM_GET}?id=${peerId}`

    return fetch(getUrl, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    })
    .then(response => response.json())
    .then((storedPeerInfo) => {
      const peerId = new PeerId(new Buffer(storedPeerInfo.id))
      const peerInfo = new PeerInfo(peerId)
      // add multiaddrs to the peer
      storedPeerInfo.multiaddrs.map((mAddr) => peerInfo.multiaddr.add(mAddr))
      return peerInfo
    })
  }

  deleteShimServer(peerId) {
    const peerInfo = this._ipfs._libp2pNode.peerInfo
    const body = { id: peerInfo.id.toB58String() }

    return fetch(SHIM_DELETE, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    })
    .then(response => response.json())
  }
}
