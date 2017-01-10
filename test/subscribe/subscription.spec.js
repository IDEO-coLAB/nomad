const expect = require('chai').expect
const promisify = require('es6-promisify')

const nodeFactory = require('./../utils/temp-node')
const ipfsFactory = require('./../utils/temp-ipfs')
const tempLocalStatePath = require('../utils/temp-local-state')()
const StreamHead = require('../../src/local-state').StreamHead
const Subscription = require('../../src/subscribe/subscription')
const MessageSequenceCheck = require('../utils/message-sequence-check')

const HASH_ENCODING = { enc: 'base58' }

describe.only('subscriptions:', () => {
  let publisher
  let subscriberIPFS 
  let subscription
  const streamHeadState = new StreamHead({ filePath: tempLocalStatePath })
  const messageSequenceCheck = new MessageSequenceCheck()

  before(() => {
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
        subscription = new Subscription(publisher.identity.id, _ipfs, streamHeadState, messageSequenceCheck.callback)
        return _ipfs.start()
      })
      .then(() => {
        // Connect the nodes
        subscriberIPFS.swarm.connectP = promisify(subscriberIPFS.swarm.connect)
        return subscriberIPFS.swarm.connectP(publisher.identity.addresses[0])
      })
      .then(() => {
        // Note: Connection timing is an issue so we need to wait
        // for the connections to open
        return new Promise((resolve) => setTimeout(resolve, 2000))
      })
  })

  after(() => {
    return Promise.all([
      publisher.teardown()
    ])
  })

  let message1 = 'message1'
  let message2 = 'message2'

  //TODO: currently fails because subscription doesn't map header -> full message
  it('receives sent messages in order', (done) => {
    messageSequenceCheck.setDone(done)
    messageSequenceCheck.expectInOrder([message1, message2])

    subscription.start()
      .then(() => {
        return publisher.publish(message1)
      })
      .then(() => {
        return publisher.publish(message2)
      })
  })
})