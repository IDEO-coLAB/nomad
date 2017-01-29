const expect = require('chai').expect
const promisify = require('es6-promisify')

const nodeFactory = require('./../utils/temp-node-shim')

const HASH_ENCODING = { enc: 'base58' }

describe('publish and subscribe:', () => {
  let pubNode, subNode


  // const ensureIpfsData = (hash, targetData) => {
  //   return ipfs.object.get(hash, HASH_ENCODING)
  //     .then((headDAG) => {
  //       const links = headDAG.toJSON().links
  //       const dataLink = links.filter((link) => {
  //         return link.name === 'data'
  //       })[0]
  //       return ipfs.object.get(dataLink.multihash, HASH_ENCODING)
  //     })
  //     .then((dataDAG) => {
  //       const testDataBuf = dataDAG.toJSON().data
  //       // TODO: figure out a better way or the IPFS API way
  //       // of deserializing a dagnode's data. This IPLD object
  //       // comes with some unicode commands at the start and end
  //       const deserializedBuf = testDataBuf.slice(4, testDataBuf.length-2)
  //       expect(deserializedBuf).to.eql(targetData)
  //     })
  // }

  before(() => {
    return Promise.all([
        nodeFactory.create(0),
        nodeFactory.create(1)
      ])
      .then((results) => {
        pubNode = results[0]
        subNode = results[1]
        return Promise.all([
          pubNode.startWithOffset(),
          subNode.startWithOffset()
        ])
      })
  })

  after(() => {
    return Promise.all([pubNode.teardown(), subNode.teardown()])
  })

  it('subscribe gets a message after publishing', (done) => {
    const message = 'hello'
    const id = pubNode.identity.id
    console.log('publishing id is', id)
    console.log('subscribing id is', subNode.identity.id)
    subNode.subscribe([id], (msg) => {
      console.log('received message')
      expect(msg.message).to.deep.equal(message)
      done()
    })
    setInterval(() => {
      pubNode.publish(message)
    }, 3000)
  })
})
