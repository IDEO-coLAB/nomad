const R = require('ramda')
const Q = require('q')
const fetch = require('isomorphic-fetch')
const path = require('path')
const PeerInfo = require('peer-info')
const PeerId = require('peer-id')
const promisify = require('es6-promisify')

const Node = require('./node')
const log = require('./utils/log')

const MODULE_NAME = 'SHIM-NODE'

const PROTOCOL_FLOODSUB = '/floodsub/1.0.0'

const SHIM_HOST = 'http://10.2.4.250:8000'
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

    const potentialDials = ids.map((id) => this.dial(id))

    Q.allSettled(potentialDials)
      .then((attemptedDials) => {
        // Note: attempt.value comes from the dial function of this Shim-node
        const dialed = attemptedDials.filter((attempt) => attempt.value !== null)
        log.info(`${MODULE_NAME}: ${dialed.length} of ${potentialDials.length} possible connections dialed`)

        super.subscribe(ids, handler)
      })
  }

  stop () {
    return this.deleteShimServer(this.identity.id)
      .then(() => super.stop())
  }

  publish (data) {
    console.log('publishing')
    if (this.registered) {
      return super.publish(data)
    }
    return this.postShimServer()
      .then(() => super.publish(data))
  }

  dial(peerId) {
    return this.getShimServer(peerId)
      .then(peerInfo => {
        if (!peerInfo) {
          return null
        }

        log.info(`${MODULE_NAME}: Dialing ${peerInfo.id.toB58String()}`)

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
      log.info(`${MODULE_NAME}: POST ${body.id}`)

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
      if (!storedPeerInfo) {
        log.info(`${MODULE_NAME}: GET ${peerId} (No info found)`)
        return null
      }

      log.info(`${MODULE_NAME}: GET ${peerId}`)

      // const peerIdObj = new PeerId(new Buffer(storedPeerInfo.id))
      // const peerInfo = new PeerInfo(peerIdObj)
      const peerInfo = new PeerInfo(PeerId.createFromB58String(storedPeerInfo.id))
      // add multiaddrs to the peer
      // storedPeerInfo.multiaddrs.forEach((mAddr) => {
      //   console.log('madr:', mAddr)
      //   peerInfo.multiaddr.add(mAddr)
      // })
      // peerInfo.multiaddr.add('/ip4/10.2.2.164/tcp/4002')
      // peerInfo.multiaddr.add('/ip4/10.2.2.164/tcp/4002')

      console.log(storedPeerInfo.multiaddrs[1])
      console.log('/ip4/10.2.2.164/tcp/4002')
      console.log('/ip4/10.2.2.164/tcp/4002' === storedPeerInfo.multiaddrs[1])

      // peerInfo.multiaddr.add(storedPeerInfo.multiaddrs[0])
      peerInfo.multiaddr.add(storedPeerInfo.multiaddrs[1])

      console.log('GOT FROM SHIM SERVER:', storedPeerInfo)
      console.log('-----------------------------------------------------')
      console.log('NEW:', peerInfo)

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
    .then((response) => {
      log.info(`${MODULE_NAME}: DELETE ${peerId}`)
      return response.json()
    })
  }
}
