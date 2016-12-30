const expect = require('chai').expect
const promisify = require('es6-promisify')

const nodeFactory = require('./../utils/temp-node')
const localState = require('../../src/local-state')

const HASH_ENCODING = { enc: 'base58' }

describe.only('subscribe:', () => {
  let nodeA
  let nodeB
  let nodeAId
  let nodeBId

  const dataRoot = 'Root publish'
  const dataTwo = 'Publish number 2'
  const dataThree = 'Publish number 3'

  before(() => {
    return Promise.all([
        nodeFactory.create(1),
        nodeFactory.create(2)
      ])
      .then((results) => {
        nodeA = results[0]
        nodeB = results[1]
        return nodeA.startWithOffset()
      })
      .then(() => nodeB.startWithOffset())
      .then(() => {
        nodeAId = nodeA.identity.id
        nodeBId = nodeB.identity.id
        // Connect the nodes

        // So this is the timing issue

        nodeB._ipfs.swarm.connectP = promisify(nodeB._ipfs.swarm.connect)

        return nodeB._ipfs.swarm.connectP(nodeA.identity.addresses[0])
      })
      .then(() => {
        console.log('jdnakjsdn')
        return new Promise((resolve) => setTimeout(resolve, 2000))
      })
  })

  after(() => {
    return Promise.all([
      nodeA.teardown(),
      nodeB.teardown()
    ])
  })

  it('test', () => {
    expect(1).to.eql(1)
  })
})
