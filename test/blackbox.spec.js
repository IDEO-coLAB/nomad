const expect = require('chai').expect
const R = require('ramda')

const ipfsControl = require('./utils/ipfs-control')
const Node = require('./../src/node')
const log = require('./../src/utils/log')

let node = null
let peerId = null
const IPFSLaunchWaitSeconds = 50

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
      peerId = getPeerId(ipfsControl.getConfig())
      node = new Node() // subscribe to self
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

    it('should succeed when publishing a string root message', (done) => {
      node.publishRoot('root message').then(() => { done() })
    })

    it('should succeed when publishing a string message after publishing a root message', (done) => {
      node.publish('second message').then(() => { done() })
    })

    it('should succeed when publishing a javascript object message', (done) => {
      node.publish({message: 'message as object'}).then(() => { done() })
    })
  })

  describe('subscribe: ', () => {
    it('should attach a handler and receive the latest message pointed to by IPNS when theres no cached subscription head', (done) => {
      node.subscribe([peerId], (message) => {
        expect(message).to.exist
        expect(R.keys(node.subscriptions).length).to.eql(1)
        done()
      })
    })
  })

  describe('unsubscribe: ', () => {
    it('should handle invalid args', () => {
      const thrower = () => node.unsubscribe({ something: 123 })
      expect(thrower).to.throw
    })

    it('success', () => {
      node.unsubscribe(peerId)
      expect(R.keys(node.subscriptions).length).to.eql(0)
    })
  })
})
