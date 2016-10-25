const expect = require('chai').expect
const ipfsControl = require('./utils/ipfs-control')
const Node = require('./../src/node')
const log = require('./../src/utils/log')

let node = null
let peerId = null
const IPFSLaunchWaitSeconds = 60

function getPeerId (configObj) {
	return configObj['Identity']['PeerID']
}

describe('Black box test of publish then subscribe:', function() {
  before((done) => {
  	ipfsControl.initIPFS()
  	ipfsControl.startIPFSDaemon()
  	log.info(`waiting ${IPFSLaunchWaitSeconds} seconds for IPFS daemon to start and find peers`)
  	setTimeout(() => {
  		node = new Node()
  		peerId = getPeerId(ipfsControl.getConfig())
  		// subscribe to self for testing
  		node.subscriptions = [peerId]
  		done()
  	}, IPFSLaunchWaitSeconds * 1000)
  })

  after(() => {
  	ipfsControl.stopIPFSDaemon()
  	ipfsControl.cleanIPFS()
  })

  it('should throw when publishing a message on a new IPFS instance before publishing root', function(done) {
  	node.publish('hello').catch((err) => {
  		done()
  	})
  })

  it('should succeed when preparing to publish', function(done) {
  	node.prepareToPublish().then(() => { done() })
  })

  it('should succeed when publishing a root message', function(done) {
  	node.publishRoot('root message').then(() => { done() })
  })

  it('should succeed when publishing a message after publishing a root message', function(done) {
  	node.publish('second message').then(() => { done() })
  })

  it('should receive a message when subscribing', function(done) {
 		node.onMessage((message) => {
 			debugger
 			log.info(message.length)
 			log.info(message[0].message)
 			expect(message).to.have.length(1)
 			expect(message[0].message).to.equal(`This is the message you're looking for`)
 			done()
 		})
 		// assume test has already published root
 		node.publish(`This is the message you're looking for`)
  })
})
