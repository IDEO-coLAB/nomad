const expect = require('chai').expect

const ipfsFactory = require('./../utils/temp-ipfs')
const nodeFactory = require('./../utils/temp-node')
const localState = require('../../src/local-state')

const HASH_ENCODING = { enc: 'base58' }

describe('publish:', () => {
  let nodeA
  let nodeB
  let nodeId
  let ipfs

  const dataRoot = 'Some publishing data'
  const dataB = 'Some more publishing data'
  const dataC = 'Yet another publish'

  // TODO: Abstract this into the util once better understood
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
        nodeFactory.create(1),
        ipfsFactory.create(2)
      ])
      .then((results) => {
        nodeA = results[0]
        ipfs = results[1]
        return Promise.all([
          nodeA.startWithOffset(),
          ipfs.start()
        ])
      })
      .then(() => {
        nodeId = nodeA.identity.id
        // Connect ipfs to the node - used for network data confirmation
        return ipfs.swarm.connect(nodeA.identity.addresses[0])
      })
  })

  after(() => {
    return Promise.all([nodeA.teardown()])
  })

  it('throws without data', () => {
    const throwerA = () => nodeA.publish()       // arg is 'undefined'
    const throwerB = () => nodeA.publish(null)   // arg is null
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
        return nodeA.publish(dataRoot)
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
        return nodeA.publish(dataB)
          .then((hashB) => {
            stored = hashB
            expect(hashB).to.exist
            expect(localState.getHeadForStream(nodeId)).to.eql(hashB)
            return ensureIpfsData(stored, dataB)
          })
          .then(() => {
            return nodeA.publish(dataC)
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
