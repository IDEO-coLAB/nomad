
const io = require('socket.io-client')

const promisify = require('es6-promisify')
const expect = require('chai').expect
const WebRTCStar = require('libp2p-webrtc-star')


const cmd = require('./../utils/cmd-runner')
const nodeFactory = require('./../utils/temp-node')


const sioOptions = {
  transports: ['websocket'],
  'force new connection': true
}

// 188.166.203.82:20000

const conn = io.connect('http://10.2.2.162:10000', sioOptions)
conn.on('connect', () => {
  console.log('connected!!')
})


nodeFactory.create()
  .then((instance) => {
    node = instance
    return node.start()
  })
  .then(() => {
    const id = node.identity.id
    node._ipfs._peerInfo.multiaddr.add(`/libp2p-webrtc-star/ip4/10.2.2.162/tcp/10000/ws/ipfs/${id}`)

    let addP = promisify(node._ipfs._libp2pNode.swarm.transport.add)
    return addP('wstar', new WebRTCStar())
  })
  .then((conn) => {
    console.log('added webrtc as a connection', conn)
    return 123
  })
  .then(() => {
    return node._ipfs.files.add(new Buffer('This is some data'))
  })
  .then((data) => {
    console.log('RECEIVED: ', data)
  })
  .catch((err) => console.log('ERR: ', err))