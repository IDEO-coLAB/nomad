const expect = require('chai').expect
const promisify = require('es6-promisify')

const ipfsFactory = require('./../utils/temp-ipfs')
const nodeFactory = require('./../utils/temp-node')

const HASH_ENCODING = { enc: 'base58' }

describe.only('publish:', () => {
  let nodeA
  let nodeAId
  let ipfs

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
        nodeFactory.create(3),
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
        console.log(nodeA.identity.addresses)
        return ipfs.swarm.connectP(nodeA.identity.addresses[0])
      })
      .then(() => {
        // Note: Connection timing is an issue so we need to wait
        // for the connections to open
        return new Promise((resolve) => setTimeout(resolve, 1200))
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

  it('node root does not exist before first publish', () => {
    return nodeA.heads.getHeadForStream(nodeAId)
      .then((headDAG) => {
        expect(headDAG).to.eql(null)
      })
  })

  it('root is stored after first publish', () => {
    let rootHash
    let storedHash

    const data = new Buffer('Some publishing data')

    return nodeA.publish(data)
      .then((rootDAG) => {
        expect(rootDAG).to.exist
        rootHash = rootDAG.multihash
        return nodeA.heads.getHeadForStream(nodeAId)
      })
      .then((storedDAG) => {
        expect(storedDAG).to.exist
        storedHash = storedDAG.multihash
        expect(storedHash).to.eql(rootHash)
        return ensureIpfsData(storedHash, data)
      })
  })

  it('staggered publishes', () => {
    let storedHash

    const dataA = new Buffer('Some more publishing data')
    const dataB = new Buffer('Yet another publish')

    return nodeA.publish(dataA)
      .then((pubDAG) => {
        expect(pubDAG).to.exist
        storedHash = pubDAG.multihash
        return nodeA.heads.getHeadForStream(nodeAId)
      })
      .then((storedDAG) => {
        const fetchedHash = storedDAG.multihash
        expect(fetchedHash).to.eql(storedHash)
        return ensureIpfsData(fetchedHash, dataA)
      })
      .then(() => nodeA.publish(dataB))
      .then((pubDAG) => {
        expect(pubDAG).to.exist
        storedHash = pubDAG.multihash
        return nodeA.heads.getHeadForStream(nodeAId)
      })
      .then((storedDAG) => {
        const fetchedHash = storedDAG.multihash
        expect(fetchedHash).to.eql(storedHash)
        return ensureIpfsData(fetchedHash, dataB)
      })
  })

  it('rapid fire publishes', () => {
    let storedHash

    const dataA = new Buffer('Some more publishing data')
    const dataB = new Buffer('Yet another publish')
    const dataC = new Buffer('Yet another publish event')
    const dataD = new Buffer('Still another publish')
    const dataE = new Buffer('Yet another publish')

    nodeA.publish(dataA)
    nodeA.publish(dataB)
    nodeA.publish(dataC)
    nodeA.publish(dataD)

    return nodeA.publish(dataE)
      .then((pubDAG) => {
        expect(pubDAG).to.exist
        storedHash = pubDAG.multihash
        return nodeA.heads.getHeadForStream(nodeAId)
      })
      .then((storedDAG) => {
        const fetchedHash = storedDAG.multihash
        expect(fetchedHash).to.eql(storedHash)
        return ensureIpfsData(fetchedHash, dataE)
      })
  })
})
