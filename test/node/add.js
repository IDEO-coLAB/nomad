const io = require('socket.io-client')

const promisify = require('es6-promisify')
const expect = require('chai').expect
const WebRTCStar = require('libp2p-webrtc-star')


const cmd = require('./../utils/cmd-runner')
const nodeFactory = require('./../utils/temp-node')

// describe('start:', () => {
//   let node

//   before(() => {
//     return nodeFactory.create()
//       .then((instance) => {
//         node = instance
//       })
//   })

//   after(() => {
//     return node.teardown()
//   })

//   it('from offline to online', () => {
//     return node.start().then((id) => {
//       expect(id).to.exist
//     })
//   })
// })

const contentHash = 'QmRWa5APckhcM9XPTojYoCreJT1JbS2qBi8vDv1RP9nsRA'

const sioOptions = {
  transports: ['websocket'],
  'force new connection': true
}

// 188.166.203.82:20000

const conn = io.connect('http://10.2.2.162:10000', sioOptions)
conn.on('connect', () => {
  console.log('connected!!')
})

let rtc

nodeFactory.create()
  .then((instance) => {
    node = instance
    return node.start()
  })
  .then(() => {
    const id = node.identity.id
    node._ipfs._peerInfo.multiaddr.add(`/libp2p-webrtc-star/ip4/10.2.2.162/tcp/10000/ws/ipfs/${id}`)

    let addP = promisify(node._ipfs._libp2pNode.swarm.transport.add)
    rtc = new WebRTCStar()
    rtc.createListener((data) => {
      console.log('hey: ', data)
    })
    return addP('wstar', rtc)
  })
  // .then(() => {
  //   const dialP = promisify(rtc.dial)
  //   return dialP(`/libp2p-webrtc-star/ip4/10.2.2.162/tcp/10000/ws/ipfs/`)
  // })
  // .then(() => {
  //   return node._ipfs.files.cat(contentHash)
  // })
  // .then((data) => {
  //   console.log('RECEIVED: ', data)
  // })
  .catch((err) => console.log('ERR: ', err))






