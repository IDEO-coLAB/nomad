const expect = require('chai').expect
const promisify = require('es6-promisify')

const ipfsFactory = require('./../utils/temp-ipfs')
const nodeFactory = require('./../utils/temp-node')

const HASH_ENCODING = { enc: 'base58' }

describe('publish:', () => {
  let nodeA
  let nodeAId
  let ipfs

  const dataRoot = new Buffer('Some publishing data')
  const dataB = new Buffer('Some more publishing data')
  const dataC = new Buffer('Yet another publish')

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
        expect(deserializedBuf).to.eql(targetData)
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
        nodeAId = nodeA.identity.id
        // Connect ipfs to the node - used for network data confirmation
        ipfs.swarm.connectP = promisify(ipfs.swarm.connect)
        return ipfs.swarm.connectP(nodeA.identity.addresses[0])
      })
      .then(() => {
        // Note: Connection timing is an issue so we need to wait
        // for the connections to open
        return new Promise((resolve) => setTimeout(resolve, 2000))
      })
  })

  after(() => {
    return Promise.all([nodeA.teardown(), ipfs.teardown()])
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
        expect(nodeA.heads.getHeadForStream(nodeAId)).to.eql(undefined)
      })

      it('root is published and the head is stored locally', () => {
        return nodeA.publish(dataRoot)
          .then((rootHash) => {
            stored = rootHash
            expect(rootHash).to.exist
            expect(nodeA.heads.getHeadForStream(nodeAId)).to.eql(rootHash)
            return ensureIpfsData(stored, dataRoot)
          })

      })
    })

    describe('non-root:', () => {
      it('a head is found locally once a publish has occurred', () => {
        expect(nodeA.heads.getHeadForStream(nodeAId)).to.eql(stored)
      })

      it('subsequent publishes work and the head hash is stored locally', () => {
        return nodeA.publish(dataB)
          .then((hashB) => {
            stored = hashB
            expect(hashB).to.exist
            expect(nodeA.heads.getHeadForStream(nodeAId)).to.eql(hashB)
            return ensureIpfsData(stored, dataB)
          })
          .then(() => {
            return nodeA.publish(dataC)
          })
          .then((hashC) => {
            stored = hashC
            expect(hashC).to.exist
            expect(nodeA.heads.getHeadForStream(nodeAId)).to.eql(hashC)
            return ensureIpfsData(stored, dataC)
          })
      })
    })
  })
})
