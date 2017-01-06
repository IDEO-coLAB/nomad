const expect = require('chai').expect
const promisify = require('es6-promisify')

const nodeFactory = require('./../utils/temp-node')

const HASH_ENCODING = { enc: 'base58' }

describe('subscriptions:', () => {
  let nodeA
  let nodeAId

  let nodeB
  let nodeBId

  let nodeC
  let nodeCId

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
      })
      .then(done)
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
        return new Promise((resolve) => setTimeout(resolve, 2000))
      })
  })

  after(() => {
    return Promise.all([
      nodeA.teardown(),
      nodeB.teardown(),
      nodeC.teardown(),
    ])
  })

  describe('subscribe', () => {
    it('throws when subscribing with no args', () => {
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

    it('A subscribes to B successfully', () => {
      nodeA.subscribe([nodeBId], () => {})
      expect(nodeA.subscriptions.size).to.eql(1)
      expect(nodeA.subscriptions.has(nodeBId)).to.eql(true)
      nodeA.unsubscribe(nodeBId)
    })

    describe('does not overwrite existing subscriptions:', () => {
      let handlerB = () => {}
      let handlerC = () => {}

      before(() => {
        nodeA.subscribe([nodeBId], handlerB)
      })

      after(() => {
        nodeA.unsubscribe(nodeBId)
        nodeA.unsubscribe(nodeCId)
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
      it(`A receives from B`, (done) => {
        const pubData = new Buffer('This is a publication')

        nodeA.subscribe([nodeBId], (msg) => {
          const headHash = msg.data.toString()
          nodeA.unsubscribe(nodeBId)
          ensureIpfsData(headHash, pubData, done)
        })

        nodeB.publish(pubData)
      })


      it(`A recursively walks when falling behind B`, (done) => {
        let receiveCount = 0

        const pubDataTwo = new Buffer('This is publication two')
        const pubDataThree = new Buffer('This is publication three')
        const pubDataFour = new Buffer('This is publication four')

        // Miss two publishes
        nodeB.publish(pubDataTwo)
        nodeB.publish(pubDataThree)

        setTimeout(() => {
          nodeA.subscribe([nodeBId], (msg) => {
            const headHash = msg.data.toString()
            if (++receiveCount > 2) {
              nodeA.unsubscribe(nodeBId)
              ensureIpfsData(headHash, pubDataFour, done)
            }
          })

          nodeB.publish(pubDataFour)
        }, 1000)
      })
    })
  })
})
