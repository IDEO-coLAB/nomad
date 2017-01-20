const io = require('socket.io-client')


const promisify = require('es6-promisify')
const expect = require('chai').expect
const WebRTCStar = require('libp2p-webrtc-star')

const PeerId = require('peer-id')
const PeerInfo = require('peer-info')


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

// const conn = io.connect('http://10.2.2.162:10000', sioOptions)
// conn.on('connect', () => {
//   console.log('connected!!')
// })

let rtc

nodeFactory.create()
  .then((instance) => {
    node = instance
    return node.start()
  })
  .then(() => {
    const id = node.identity.id
    // node._ipfs._peerInfo.multiaddr.add(`/libp2p-webrtc-star/ip4/10.2.2.162/tcp/10000/ws/ipfs/${id}`)

    let addP = promisify(node._ipfs._libp2pNode.swarm.transport.add)
    rtc = new WebRTCStar()
    // rtc.createListener((data) => {
    //   console.log('hey: ', data)
    // })
    return addP('wstar', rtc)
  })
  .then(() => {
    console.log('trying to dial...')
    // const dialP = promisify(rtc.dial)

    const id = PeerId.createFromB58String('QmQy9MiS5weQfpYP48cnBPoRgLbfK2zmpCQAU7tNb9VbAJ')
    const info = new PeerInfo(id)

    console.log(info)

    return node._ipfs._libp2pNode.swarm.dial(info)
    // return node._ipfs._libp2pNode.swarm.dial(`/libp2p-webrtc-star/ip4/10.2.2.162/tcp/10000/ws/ipfs/QmQy9MiS5weQfpYP48cnBPoRgLbfK2zmpCQAU7tNb9VbAJ`)
  })
  // .then(() => {
  //   return node._ipfs.files.cat(contentHash)
  // })
  .then((data) => {
    console.log('dialed: ', data)
  })
  .catch((err) => console.log('ERR: ', err))






