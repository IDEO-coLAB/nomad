// answers a peer dial, then starts publishing

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

const sioOptions = {
  transports: ['websocket'],
  'force new connection': true
}

const multiAddrString = (ip, port, peerId) => {
  return `/libp2p-webrtc-star/ip4/${ip}/tcp/${port}/ws/ipfs/${peerId}`
}

let rtc, node

nodeFactory.create(0)
  .then((instance) => {
    node = instance
    return node.startWithOffset()
  })
  .then(() => {
    // add multiaddress with signaling server to our peer id
    const ownAddress = multiaddr(multiAddrString(signalAddress, signalPort, node.identity.id))
    node._ipfs._libp2pNode.peerInfo.multiaddrs.push(ownAddress)

    console.log('peer id is ', node.identity.id)

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
    setInterval(() => {
      node.publish('gman it fucking works...')
      .catch((err) => {
        console.log('err', err)
      })
    }, 2000)
  })
  .catch((err) => console.log('ERR: ', err))



// setInterval(() => {
//   const _node = node
//   debugger
// }, 10000)






