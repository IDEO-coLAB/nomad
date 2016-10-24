const expect = require('chai').expect
const ipfsControl = require('./utils/ipfs-control')
const Node = require('./../src/node')
const log = require('./../src/utils/log')

let node = null
const IPFSLaunchWaitSeconds = 60

describe('Black box publish then subscribe:', function() {
  before((done) => {
  	ipfsControl.initIPFS()
  	ipfsControl.startIPFSDaemon()
  	log.info(`waiting ${IPFSLaunchWaitSeconds} seconds for IPFS daemon to start and find peers`)
  	setTimeout(() => {
  		node = new Node()
  		done()
  	}, IPFSLaunchWaitSeconds * 1000)
  })

  after(() => {
  	ipfsControl.stopIPFSDaemon()
  	ipfsControl.cleanIPFS()
  })

  it('should throw when publishing a message on a new IPFS instance before publishing root', function(done) {
  	node.publish('test-message-1')
  		.catch((err) => {
  			done()
  		})
  })

  // it should throw when publishing root before calling prepare to publish

  it('should succeed when preparing to publish', function(done) {
  	node.prepareToPublish().then(function() { done() })
  })

  it('should succeed when publishing a root message', function(done) {
  	node.publishRoot('root message').then(function() { done() })
  })

   it('should succeed when publishing a message after publishing a root message', function(done) {
  	node.publish('second message').then(function() { done() })
  })

   // it('should receive a message when subscribing', function(done) {
   	
   // })
})
