const expect = require('chai').expect

const utils = require('./../utils/ipfs-utils')
const localState = require('../../src/local-state')
const Node = require('../../src/node')
const ipfs = require('../../src/utils/ipfs')

const ensureDataLink = (hash, targetData) => {
  return ipfs.object.get(hash)
  .then((headDAG) => {
    const links = headDAG.toJSON().links
    const dataLink = links.filter((link) => {
      return link.name === 'data'
    })[0]
    return ipfs.object.get(dataLink.multihash)
  })
  .then((dataDAG) => {
    const testData = dataDAG.toJSON().data.toString()
    expect(testData).to.eql(targetData)
  })
}

describe('publish:', () => {
  let node
  let nodeId

  const dataRoot = 'Some publishing data'
  const dataB = 'Some more publishing data'
  const dataC = 'Yet another publish'

  before(() => {
    node = new Node(utils.config)
    return node.start()
      .then(() => {
        nodeId = node.identity.id
        return true
      })
  })

  after(() => {
    return node.stop().then(utils.cleanRepo)
  })

  it('throws without data', () => {
    const throwerA = () => node.publish() // undefined
    const throwerB = () => node.publish(null)
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
            return ensureDataLink(stored, dataRoot)
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
            return ensureDataLink(stored, dataB)
          })
          .then(() => {
            return node.publish(dataC)
          })
          .then((hashC) => {
            stored = hashC
            expect(hashC).to.exist
            expect(localState.getHeadForStream(nodeId)).to.eql(hashC)
            return ensureDataLink(stored, dataC)
          })
      })
    })
  })
})
