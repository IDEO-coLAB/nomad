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

const MODULE_NAME = 'SHIM-NODE'

const SIGNAL_SERVER_IP = '138.197.196.251'
const SIGNAL_SERVER_PORT = '10000'


const DEFAULT_CONFIG = {
  db: `${path.resolve(__dirname)}/.nomad-store`,
  repo: `${path.resolve(__dirname)}/.ipfs-store`,
  ipfs: { emptyRepo: true, bits: 2048 }
}

// helper function to construct multiaddress strings
const multiAddrString = (ip, port, peerId) => {
  return `/libp2p-webrtc-star/ip4/${ip}/tcp/${port}/ws/ipfs/${peerId}`
}

module.exports = class ShimNode extends Node {
  // Overrides of Node methods
  constructor (config = DEFAULT_CONFIG) {
    super(config)
  }

  start () {
    return super.start()
      .then(() => {
        // add multiaddress with signaling server to our peer id
        const ownAddress = multiaddr(multiAddrString(SIGNAL_SERVER_IP, SIGNAL_SERVER_PORT, this.identity.id))
        this._ipfs._libp2pNode.peerInfo.multiaddrs.push(ownAddress)

         // add web rtc star transport
        rtc = new WebRTCStar()
        // listener = rtc.createListener()
        // listener.listen(ownAddress)
        let addP = promisify(this._ipfs._libp2pNode.swarm.transport.add)
        return addP('wstar', rtc)
      })
      .then (() => {
        return promisify(this._ipfs._libp2pNode.swarm.listen())
      })
      .then(() => {
        return Promise.resolve(this)
      })
      .catch((err) => {
        log.err('err: ', err)
      })
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

  // TODO: If target peer is offline (or nonexistent) but signaling server is up
  // I think dial will still succeed.
  dial(peerId) {
    // build peer info for the one we're dialing
    const id = PeerId.createFromB58String(peerId)
    const otherPeer = new PeerInfo(id)
    const otherMultiAddressString = multiAddrString(SIGNAL_SERVER_IP, SIGNAL_SERVER_PORT, peerId)
    const otherAddress = multiaddr(otherMultiAddressString)
    otherPeer.multiaddr.add(otherAddress)

    const _dial = promisify(this._ipfs._libp2pNode.swarm.dial)
    return _dial(otherPeer)
      .then(() => {
        return Promise.resolve(true)
      })
      .catch((err) => {
        log.err('err: ', err)
        return Promise.resolve(null)
      })
  }  
}
