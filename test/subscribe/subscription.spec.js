const expect = require('chai').expect
const promisify = require('es6-promisify')

const nodeFactory = require('../utils/temp-node')
const ipfsFactory = require('../utils/temp-ipfs')
const tempLocalStatePath = require('../utils/temp-local-state')()
const StreamHead = require('../../src/local-state').StreamHead
const { Subscription } = require('../../src/subscribe')
const MessageSequenceCheck = require('../utils/message-sequence-check')

const HASH_ENCODING = { enc: 'base58' }

describe.only('subscribe:', () => {
  describe('single node:', () => {
    let publisher
    let subscription
    let subscriberIPFS

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

    describe('base case (in-order delivery):', () => {
      const message1 = 'message1'
      const message2 = 'message2'
      const message3 = 'message3'
      const message4 = 'message4'
      const message5 = 'message5'

      it('receives a single message', (done) => {
        messageSequenceCheck.expectInOrder([message1], done)

        subscription.start()
          .then(() => publisher.publish(message1))
      })

      it('receives two messages in order', (done) => {
        messageSequenceCheck.expectInOrder([message1, message2], done)

        subscription.start()
          .then(() => publisher.publish(message1))
          .then(() => publisher.publish(message2))
      })

      it('receives 5 messages in order', (done) => {
        messageSequenceCheck.expectInOrder([message1, message2, message3, message4, message5], done)

        subscription.start()
          .then(() => publisher.publish(message1))
          .then(() => publisher.publish(message2))
          .then(() => publisher.publish(message3))
          .then(() => publisher.publish(message4))
          .then(() => publisher.publish(message5))
      })
    })
  })
})
