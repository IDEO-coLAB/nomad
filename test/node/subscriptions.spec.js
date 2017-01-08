const expect = require('chai').expect
const promisify = require('es6-promisify')

const nodeFactory = require('./../utils/temp-node')

const HASH_ENCODING = { enc: 'base58' }

describe.only('subscriptions:', () => {
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
        // Yo gav, I think it may be because you're creating the DAG node 
        // with ipfs.files.add instead of ipfs.object.patch.data -REW
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

  xdescribe('subscribe:', () => {
    describe('single node:', () => {
      it('throws without args', () => {
        const throwerA = () => nodeA.subscribe()
        expect(throwerA).to.throw
      })

      it('throws without ids', () => {
        const cb = () => {}
        const throwerA = () => nodeA.subscribe(cb)
        expect(throwerA).to.throw
      })

      it('throws with non-array ids', () => {
        const cb = () => {}
        const throwerA = () => nodeA.subscribe({}, cb)
        expect(throwerA).to.throw
      })

      it('throws with empty array ids', () => {
        const cb = () => {}
        const throwerA = () => nodeA.subscribe([], cb)
        expect(throwerA).to.throw
      })

      it('throws with invalid callback', () => {
        const throwerA = () => nodeA.subscribe([nodeBId], 'notAfunction')
        expect(throwerA).to.throw
      })

      // TODO: Decide on this API - this is currently a 'get it working first' case
      // Behavior is currently this:
      // nodeA.subscribe(nodeB, handler1)
      // nodeA.subscribe(nodeB, handler2) => handler2 will not be registered currently...will change
      describe('multiple subscribe calls to same hash:', () => {
        const handlerB = () => {}
        const handlerC = () => {}

        before(() => {
          nodeA.subscribe([nodeBId], handlerB)
        })

        after(() => {
          nodeA.unsubscribe(nodeBId)
          nodeA.unsubscribe(nodeCId)
        })

        it('will not overwrite first subscription', () => {
          const randomFn = () => {}
          nodeA.subscribe([nodeBId], randomFn)

          expect(nodeA.subscriptions.size).to.eql(1)
          expect(nodeA.subscriptions.get(nodeBId)).to.eql(handlerB)
        })

        it('dedupes and adds new subscriptions', () => {
          nodeA.subscribe([nodeBId, nodeCId], handlerC)

          expect(nodeA.subscriptions.size).to.eql(2)
          expect(nodeA.subscriptions.has(nodeBId)).to.eql(true)
          expect(nodeA.subscriptions.has(nodeCId)).to.eql(true)

          expect(nodeA.subscriptions.get(nodeBId)).to.eql(handlerB)
          expect(nodeA.subscriptions.get(nodeCId)).to.eql(handlerC)
        })
      })
    })

    describe('multiple nodes (A => B):', () => {
      const pubRoot = new Buffer('A root is now published')
      const pubDataA = new Buffer('This is publication a')
      const pubDataB = new Buffer('This is publication b')
      const pubDataC = new Buffer('This is publication c')
      const pubDataD = new Buffer('This is publication d')

      before(() => {
        return nodeB.publish(pubRoot)
      })

      it('A subscription list contains B', () => {
        const handlerOne = () => {}
        nodeA.subscribe([nodeBId], handlerOne)

        // TODO: swap node.subscriptions to return a list
        expect(nodeA.subscriptions.size).to.eql(1)
        expect(nodeA.subscriptions.has(nodeBId)).to.eql(true)

        nodeA.unsubscribe(nodeBId)
      })

      it(`B publish a single message => A receives`, (done) => {
        const someData = new Buffer('This is a publication')

        nodeA.subscribe([nodeBId], (msg) => {
          const headHash = msg.data.toString()
          nodeA.unsubscribe(nodeBId)
          ensureIpfsData(headHash, someData, done)
        })

        nodeB.publish(someData)
      })

      it(`B publishes rapid fire => A receives all`, (done) => {
        console.log('------------------------------------------------\n\n\n\n')
        let receiveCount = 0

        nodeA.subscribe([nodeBId], (msg) => {
          const headHash = msg.data.toString()
          if (++receiveCount > 3) {
            console.log('receiveCoun', receiveCount)
            nodeA.unsubscribe(nodeBId)
            ensureIpfsData(headHash, pubDataD, done)
          }
        })

        nodeB.publish(pubDataA)
        nodeB.publish(pubDataB)
        nodeB.publish(pubDataC)
        nodeB.publish(pubDataD)
      })

      xit(`A misses messages from B => missed messages are found and delivered`, (done) => {
        let receiveCount = 0

        // Miss two publishes
        nodeB.publish(pubDataA)
        nodeB.publish(pubDataB)

        setTimeout(() => {
          nodeA.subscribe([nodeBId], (msg) => {
            const headHash = msg.data.toString()
            if (++receiveCount > 3) {
              nodeA.unsubscribe(nodeBId)
              ensureIpfsData(headHash, pubDataD, done)
            }
          })

          // Trigger two rapid-fire publishes
          nodeB.publish(pubDataC)
          nodeB.publish(pubDataD)
        }, 1000)
      })
    })
  })
})
