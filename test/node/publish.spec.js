const expect = require('chai').expect

const ipfsFactory = require('./../utils/factory-ipfs')
const nodeFactory = require('./../utils/factory-node')
const localState = require('../../src/local-state')

const HASH_ENCODING = { enc: 'base58' }

describe('publish:', () => {
  let node
  let nodeId
  let ipfs

  const dataRoot = 'Some publishing data'
  const dataB = 'Some more publishing data'
  const dataC = 'Yet another publish'

  const ensureIpfsData = (hash, targetData) => {
    return ipfs.object.get(hash, HASH_ENCODING)
      .then((headDAG) => {
        const links = headDAG.toJSON().links
        const dataLink = links.filter((link) => {
          return link.name === 'data'
        })[0]
        return ipfs.object.get(dataLink.multihash, HASH_ENCODING)
      })
      .then((dataDAG) => {
        const testDataBuf = dataDAG.toJSON().data
        // TODO: figure out a better way or the IPFS API way
        // of deserializing a dagnode's data. This IPLD object
        // comes with some unicode commands at the start and end
        const deserializedBuf = testDataBuf.slice(4, testDataBuf.length-2)
        expect(deserializedBuf.toString()).to.eql(targetData)
      })
  }

  before(() => {
    return Promise.all([
        nodeFactory.create(),
        ipfsFactory.create('01')
      ])
      .then((results) => {
        return Promise.all([
          results[0].start(),
          results[1].start()
        ])
      })
      .then((results) => {
        node = results[0]
        nodeId = node.identity.id
        ipfs = results[1]

        // Connect the running ipfs instance to the new node
        return ipfs.swarm.connect(node.identity.addresses[0])
      })
  })

  after(() => {
    return Promise.all([node.teardown(), ipfs.teardown()])
  })

  it('throws without data', () => {
    const throwerA = () => node.publish()       // arg is 'undefined'
    const throwerB = () => node.publish(null)   // arg is null
    expect(throwerA).to.throw
    expect(throwerB).to.throw
  })

  describe('no local state:', () => {
    let stored = null

    describe('root:', () => {
      it('no head stored locally before root is published', () => {
        expect(localState.getHeadForStream(nodeId)).to.eql(undefined)
      })

      it('root is published and the head is stored locally', () => {
        return node.publish(dataRoot)
          .then((rootHash) => {
            stored = rootHash
            expect(rootHash).to.exist
            expect(localState.getHeadForStream(nodeId)).to.eql(rootHash)
            return ensureIpfsData(stored, dataRoot)
          })

      })
    })

    describe('non-root:', () => {
      it('a head is found locally once a publish has occurred', () => {
        expect(localState.getHeadForStream(nodeId)).to.eql(stored)
      })

      it('subsequent publishes work and the head hash is stored locally', () => {
        return node.publish(dataB)
          .then((hashB) => {
            stored = hashB
            expect(hashB).to.exist
            expect(localState.getHeadForStream(nodeId)).to.eql(hashB)
            return ensureIpfsData(stored, dataB)
          })
          .then(() => {
            return node.publish(dataC)
          })
          .then((hashC) => {
            stored = hashC
            expect(hashC).to.exist
            expect(localState.getHeadForStream(nodeId)).to.eql(hashC)
            return ensureIpfsData(stored, dataC)
          })
      })
    })
  })
})
