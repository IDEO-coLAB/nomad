const expect = require('chai').expect
const promisify = require('es6-promisify')

const nodeFactory = require('./../utils/temp-node-shim')

const HASH_ENCODING = { enc: 'base58' }

describe('publish and subscribe:', () => {
  let pubNode, subNode

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
    subNode.subscribe([id], (msgObj) => {
      expect(msgObj.message).to.deep.equal(message)
      expect(msgObj.id).to.deep.equal(id)
      expect(msgObj.link).to.exist
      done()
    })
    setTimeout(() => {
      pubNode.publish(message)
    }, 20000)
  })
})
