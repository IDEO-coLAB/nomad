const R = require('ramda')
const Q = require('q')
const fetch = require('isomorphic-fetch')
const path = require('path')
const PeerInfo = require('peer-info')
const PeerId = require('peer-id')
const multiaddr = require('multiaddr')
const WebRTCStar = require('libp2p-webrtc-star')
const promisify = require('es6-promisify')

const Node = require('./node')
const log = require('./utils/log')
const sigServConfig = require('./config/signal-server-config.json')
const { webRTCMultiAddr } = require('./utils/ipfs-strings')

const MODULE_NAME = 'SHIM-NODE'

// const SIGNAL_SERVER_IP = '138.197.196.251'
// const SIGNAL_SERVER_PORT = '10000'

let DEFAULT_CONFIG = {
  db: `${process.cwd()}/nomad-store`,
  repo: `${process.cwd()}/ipfs-store`,
  ipfs: { bits: 2048, emptyRepo: true }
}

// // helper function to construct multiaddress strings
// const multiAddrString = (ip, port, peerId) => {
//   return `/libp2p-webrtc-star/ip4/${ip}/tcp/${port}/ws/ipfs/${peerId}`
// }

module.exports = class ShimNode extends Node {
  constructor (config = DEFAULT_CONFIG) {
    super(config)
  }

  // Overload the regular subscribe method
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
        const dialed = attemptedDials.filter((attempt) => attempt.state === 'fulfilled')
        log.info(`${MODULE_NAME}: ${dialed.length} of ${potentialDials.length} possible connections dialed`)
        console.log('dialed is', dialed)
        const dialedPeerIds = dialed.map(obj => obj.value)
        console.log('sending this list of peers to parent', dialedPeerIds)

        super.subscribe(dialedPeerIds, handler)
      })
      .catch((err) => {
        console.log('err', err)
        log.err('err', err)
      })
  }

  // TODO: If target peer is offline (or nonexistent) but signaling server is up
  // I think dial will still succeed.
  // Returns promise that resolves to peerId
  dial(peerId) {
    // build peer info for the one we're dialing
    const id = PeerId.createFromB58String(peerId)
    const otherPeer = new PeerInfo(id)
    const otherMultiAddressString = webRTCMultiAddr(sigServConfig.IP, sigServConfig.port, peerId)
    const otherAddress = multiaddr(otherMultiAddressString)
    otherPeer.multiaddr.add(otherAddress)

    const _dial = promisify(this._ipfs._libp2pNode.swarm.dial)
    return _dial(otherPeer)
      .then(() => {
        return Promise.resolve(peerId)
      })
      .catch((err) => {
        log.err('err: ', err)
        return Promise.resolve(null)
      })
  }
}
