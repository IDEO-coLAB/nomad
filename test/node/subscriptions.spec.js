const expect = require('chai').expect
const promisify = require('es6-promisify')

const nodeFactory = require('./../utils/temp-node')
const localState = require('../../src/local-state')

const HASH_ENCODING = { enc: 'base58' }

describe('subscriptions:', () => {
  let nodeA
  let nodeAId

  let nodeB
  let nodeBId

  let nodeC
  let nodeCId

  const dataRoot = 'Root publish'
  const dataTwo = 'Publish number 2'
  const dataThree = 'Publish number 3'

  const ensureIpfsData = (hash, targetData, done) => {
    return nodeA._ipfs.object.get(hash, HASH_ENCODING)
      .then((headDAG) => {
        const links = headDAG.toJSON().links
        const dataLink = links.filter((link) => {
          return link.name === 'data'
        })[0]
        return nodeA._ipfs.object.get(dataLink.multihash, HASH_ENCODING)
      })
      .then((dataDAG) => {
        const testDataBuf = dataDAG.toJSON().data
        // TODO: figure out a better way or the IPFS API way
        // of deserializing a dagnode's data. This IPLD object
        // comes with some unicode commands at the start and end
        const deserializedBuf = testDataBuf.slice(4, testDataBuf.length-2)
        expect(deserializedBuf).to.eql(targetData)
        done()
      })
      .catch(console.log)
  }

  before(() => {
    return Promise.all([
        nodeFactory.create(1),
        nodeFactory.create(2),
        nodeFactory.create(3)
      ])
      .then((results) => {
        nodeA = results[0]
        nodeB = results[1]
        nodeC = results[2]
        return nodeA.startWithOffset()
      })
      .then(() => nodeB.startWithOffset())
      .then(() => nodeC.startWithOffset())
      .then(() => {
        nodeAId = nodeA.identity.id
        nodeBId = nodeB.identity.id
        nodeCId = nodeC.identity.id

        // Connect the nodes
        nodeB._ipfs.swarm.connectP = promisify(nodeB._ipfs.swarm.connect)
        nodeC._ipfs.swarm.connectP = promisify(nodeC._ipfs.swarm.connect)
        return Promise.all([
          nodeB._ipfs.swarm.connectP(nodeA.identity.addresses[0]),
          nodeC._ipfs.swarm.connectP(nodeA.identity.addresses[0])
        ])
      })
      .then(() => {
        // Note: Connection timing is an issue so we need to wait
        // for the connections to open
        return new Promise((resolve) => setTimeout(resolve, 1000))
      })
  })

  after(() => {
    return Promise.all([
      nodeA.teardown(),
      nodeB.teardown()
    ])
  })

  describe('subscribe', () => {
    it('throws when subscribing without anything', () => {
      const throwerA = () => nodeA.subscribe()
      expect(throwerA).to.throw
    })

    it('throws when subscribing without ids', () => {
      const cb = () => {}
      const throwerA = () => nodeA.subscribe(cb)
      expect(throwerA).to.throw
    })

    it('throws when subscribing with non-array ids', () => {
      const cb = () => {}
      const throwerA = () => nodeA.subscribe({}, cb)
      expect(throwerA).to.throw
    })

    it('throws when subscribing with empty-array ids', () => {
      const cb = () => {}
      const throwerA = () => nodeA.subscribe([], cb)
      expect(throwerA).to.throw
    })

    it('throws when subscribing with invalid callback', () => {
      const throwerA = () => nodeA.subscribe([nodeBId], 'notAfunction')
      expect(throwerA).to.throw
    })

    describe('does not overwrite existing subscriptions:', () => {
      let handlerB = () => {}
      let handlerC = () => {}

      after(() => {
        nodeA.unsubscribe(nodeBId)
        nodeA.unsubscribe(nodeCId)
      })

      it('adds a subscription to the node', () => {
        nodeA.subscribe([nodeBId], handlerB)
        expect(nodeA.subscriptions.size).to.eql(1)
        expect(nodeA.subscriptions.has(nodeBId)).to.eql(true)
      })

      it('does not duplicate subscriptions', () => {
        nodeA.subscribe([nodeBId], () => {})
        expect(nodeA.subscriptions.size).to.eql(1)
        expect(nodeA.subscriptions.get(nodeBId)).to.eql(handlerB)
      })

      it('filters out duplicate subscriptions and adds new ones', () => {
        nodeA.subscribe([nodeBId, nodeCId], handlerC)
        expect(nodeA.subscriptions.size).to.eql(2)
        expect(nodeA.subscriptions.has(nodeBId)).to.eql(true)
        expect(nodeA.subscriptions.has(nodeCId)).to.eql(true)

        expect(nodeA.subscriptions.get(nodeBId)).to.eql(handlerB)
        expect(nodeA.subscriptions.get(nodeCId)).to.eql(handlerC)
      })
    })

    describe('B publishes to A', () => {
      after(() => {
        nodeA.unsubscribe(nodeBId)
      })

      it(`A receives B's new node head`, (done) => {
        const pubData = new Buffer('This is a publication')

        nodeA.subscribe([nodeBId], (d) => {
          const headHash = d.data.toString()
          ensureIpfsData(headHash, pubData, done)
        })

        nodeB.publish(pubData)
      })
    })
  })
})
