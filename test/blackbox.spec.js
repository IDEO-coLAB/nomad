const expect = require('chai').expect

const ipfsControl = require('./utils/ipfs-control')
const Node = require('./../src/node')
const log = require('./../src/utils/log')

let node = null
let peerId = null
const IPFSLaunchWaitSeconds = 60

function getPeerId(configObj) {
  return configObj.Identity.PeerID
}

describe('Black box test of publish then subscribe:', () => {
  before((done) => {
    ipfsControl.cleanIPFS()
    ipfsControl.initIPFS()
    ipfsControl.startIPFSDaemon()
    log.info(`waiting ${IPFSLaunchWaitSeconds} seconds for IPFS daemon to start and find peers`)
    setTimeout(() => {
      node = new Node()
      peerId = getPeerId(ipfsControl.getConfig())
      // Note: Override local subscriptions and force subscribe to self for testing
      node.subscriptions = [peerId]
      done()
    }, IPFSLaunchWaitSeconds * 1000)
  })

  after(() => {
    ipfsControl.stopIPFSDaemon()
    ipfsControl.cleanIPFS()
  })

  describe('publish: ', () => {
    // it('should throw when publishing a message on a new IPFS instance before publishing root', (done) => {
    //   node.publish('hello').catch((err) => {
    //     expect(err).to.exist
    //     done()
    //   })
    // })

    it('should succeed when preparing to publish', (done) => {
      node.prepareToPublish().then(() => { done() })
    })

    it('should succeed when publishing a root message', (done) => {
      node.publishRoot('root message').then(() => { done() })
    })

    it('should succeed when publishing a message after publishing a root message', (done) => {
      node.publish('second message').then(() => { done() })
    })
  })

  // describe('subscribe: ', () => {
  //   it('should receive the latest message pointed to by IPNS when theres no cached subscription head', (done) => {
  //     node.subscribe([peerId], (err, message) => {
  //       expect(err).to.not.exist
  //       expect(message.message).to.eql('second message')
  //       done()
  //     })
  //   })
  // })

  // describe('messages: ', () => {
  //   it('should allow a user to get all received messages for a specific key', (done) => {
  //     const messages = node.messages.get(peerId)
  //     expect(messages).to.have.length(1)
  //     expect(messages[0]).to.equal('This is the message you\'re looking for')
  //     done()
  //   })
  // })
})
