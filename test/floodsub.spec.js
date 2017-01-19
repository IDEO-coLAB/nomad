const expect = require('chai').expect
const promisify = require('es6-promisify')
const PeerInfo = require('peer-info')
const PeerId = require('peer-id')

const nodeFactory = require('./utils/temp-node')
const ipfsFactory = require('./utils/temp-ipfs')

const HASH_ENCODING = { enc: 'base58' }

let publisher
let subscriberIPFS
let subscription


const before = () => {
  return Promise.all([
      nodeFactory.create(0)
    ])
    .then((results) => {
      publisher = results[0]
      return Promise.all([
        publisher.startWithOffset()
      ])
    })
    .then(() => {
      return ipfsFactory.create(1)
    })
    .then((_ipfs) => {
      subscriberIPFS = _ipfs
      return _ipfs.start()
    })
    .then(() => {
      // Note: Connection timing is an issue so we need to wait
      // for the connections to open
      return new Promise((resolve) => setTimeout(resolve, 5000))
    })
    .then(() => {
      const peer = new PeerInfo(new PeerId(new Buffer(publisher.identity.id)))
      debugger

      subscriberIPFS._libp2pNode.swarm.dial(peer, '/floodsub/1.0.0', (err, obj) => {
        debugger
      })
      // Connect the nodes
      console.log(publisher.identity.addresses)
      return Promise.resolve(null)
      // subscriberIPFS.swarm.connectP = promisify(subscriberIPFS.swarm.connect)
      // return subscriberIPFS.swarm.connectP(publisher.identity.addresses[0])
    })
    .then(() => {
      // Note: Connection timing is an issue so we need to wait
      // for the connections to open
      return new Promise((resolve) => setTimeout(resolve, 2000))
    })
}


before().then(() => {
  console.log('done')
})

