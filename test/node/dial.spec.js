const io = require('socket.io-client')


const promisify = require('es6-promisify')
const expect = require('chai').expect
const WebRTCStar = require('libp2p-webrtc-star')

const PeerId = require('peer-id')
const PeerInfo = require('peer-info')
const multiaddr = require('multiaddr')


const cmd = require('./../utils/cmd-runner')
const nodeFactory = require('./../utils/temp-node-2') // note using modified factory

const signalAddress = '10.2.4.150'
const signalPort = '10000'

const otherPeerIdHash = 'QmXsdD2qDJdviKU7H8hs9WTtN1RFfZjqKtRcesJbHUHiaq'

const sioOptions = {
  transports: ['websocket'],
  'force new connection': true
}

const multiAddrString = (ip, port, peerId) => {
  return `/libp2p-webrtc-star/ip4/${ip}/tcp/${port}/ws/ipfs/${peerId}`
}

let rtc, listener

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
    // listener = rtc.createListener()
    // listener.listen(ownAddress)
    let addP = promisify(node._ipfs._libp2pNode.swarm.transport.add)
    return addP('wstar', rtc)
  })
  .then(() => {
    return promisify(node._ipfs._libp2pNode.swarm.listen())
  })
  .then(() => {
    // build peer info for the answering peer
    const id = PeerId.createFromB58String(otherPeerIdHash)
    const otherPeer = new PeerInfo(id)
    const otherMultiAddressString = multiAddrString(signalAddress, signalPort, otherPeerIdHash)
    debugger
    const otherAddress = multiaddr(otherMultiAddressString)
    otherPeer.multiaddr.add(otherAddress)

    return node._ipfs._libp2pNode.swarm.dial(otherPeer)
    debugger
  })
  // // .then(() => {
  // //   return node._ipfs.files.cat(contentHash)
  // // })
  // .then((data) => {
  //   console.log('dialed: ', data)
  // })
  .catch((err) => console.log('ERR: ', err))






