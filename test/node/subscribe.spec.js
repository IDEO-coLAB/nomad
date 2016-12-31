const expect = require('chai').expect
const promisify = require('es6-promisify')

const nodeFactory = require('./../utils/temp-node')
const localState = require('../../src/local-state')

const HASH_ENCODING = { enc: 'base58' }

describe.only('subscribe:', () => {
  let nodeA
  let nodeAId

  let nodeB
  let nodeBId

  let nodeC
  let nodeCId

  const dataRoot = 'Root publish'
  const dataTwo = 'Publish number 2'
  const dataThree = 'Publish number 3'

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

  describe.only('no existing subscriptions:', () => {
    let initialSubscription

    it('adds a subscription to the node', () => {
      const callback = () => {}
      nodeA.subscribe([nodeBId], callback)
      expect(nodeA.subscriptions.size).to.eql(1)
      expect(nodeA.subscriptions.has(nodeBId)).to.eql(true)
      // Get a handle on this to test for duplicates
      initialSubscription = nodeA.subscriptions.get(nodeBId)
    })

    it('does not duplicate subscriptions', () => {
      const callback = () => {}
      nodeA.subscribe([nodeBId], callback)
      expect(nodeA.subscriptions.size).to.eql(1)
      expect(nodeA.subscriptions.get(nodeBId)).to.eql(initialSubscription)
    })

    it('filters out duplicate subscriptions and adds new ones', () => {
      const callback = () => {}
      nodeA.subscribe([nodeBId, nodeCId], callback)
      expect(nodeA.subscriptions.size).to.eql(2)
      expect(nodeA.subscriptions.has(nodeBId)).to.eql(true)
      expect(nodeA.subscriptions.has(nodeCId)).to.eql(true)
    })
  })
})
