const expect = require('chai').expect
const promisify = require('es6-promisify')

const nodeFactory = require('./../utils/temp-node')
const ipfsFactory = require('./../utils/temp-ipfs')

const HASH_ENCODING = { enc: 'base58' }

describe.only('subscriptions:', () => {
  let publisher
  let subscriberIPFS 

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

  describe('testing subscribe:', () => {
    it('scratch', () => {
      subscriberIPFS.pubsub.subscribe(publisher.identity.id, (msg) => {
        console.log(JSON.parse(msg.data.toString()))
      })
      return publisher.publish('its a message')
      .then(() => {
        return publisher.publish('another message')
      })
      // .then(() => {
    })
  })
})