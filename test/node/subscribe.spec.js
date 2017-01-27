const io = require('socket.io-client')


const promisify = require('es6-promisify')
const expect = require('chai').expect
const WebRTCStar = require('libp2p-webrtc-star')
// dials a peer then starts subscribing


const PeerId = require('peer-id')
const PeerInfo = require('peer-info')
const multiaddr = require('multiaddr')


const cmd = require('./../utils/cmd-runner')
const nodeFactory = require('./../utils/temp-node-2') // note using modified factory

const signalAddress = '10.2.4.150'
const signalPort = '10000'

const otherPeerIdHash = 'QmT9eGbyuCvwH422fGh2B3y94Zpiotn2Y5o4myVYx5mTWD'

const sioOptions = {
  transports: ['websocket'],
  'force new connection': true
}

const multiAddrString = (ip, port, peerId) => {
  return `/libp2p-webrtc-star/ip4/${ip}/tcp/${port}/ws/ipfs/${peerId}`
}

let rtc, node

nodeFactory.create(1)
  .then((instance) => {
    node = instance
    return node.startWithOffset()
  })
  .then(() => {
    // add multiaddress with signaling server to our peer id
    const ownAddress = multiaddr(multiAddrString(signalAddress, signalPort, node.identity.id))
    node._ipfs._libp2pNode.peerInfo.multiaddrs.push(ownAddress)

    console.log('peer info ----------------------------------\n', node._ipfs._libp2pNode.peerInfo)

     // add web rtc star transport
    rtc = new WebRTCStar()
    let addP = promisify(node._ipfs._libp2pNode.swarm.transport.add)
    return addP('wstar', rtc)
  })
  .then(() => {
    // must call listen after adding a new transport
    return promisify(node._ipfs._libp2pNode.swarm.listen())
  })
  .then(() => {
    // build peer info for the answering peer
    const id = PeerId.createFromB58String(otherPeerIdHash)
    const otherPeer = new PeerInfo(id)
    const otherMultiAddressString = multiAddrString(signalAddress, signalPort, otherPeerIdHash)
    const otherAddress = multiaddr(otherMultiAddressString)
    otherPeer.multiaddr.add(otherAddress)

    return node._ipfs._libp2pNode.swarm.dial(otherPeer)
  })
  .then(() => {
    debugger
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        node.subscribe([otherPeerIdHash], (obj) => {
          console.log('got a message from ', otherPeerIdHash)
          console.log('message obj is ', obj)
        })
        resolve()
      }, 5000)
    })
  })
  .catch((err) => console.log('ERR: ', err))






