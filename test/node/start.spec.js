const expect = require('chai').expect

const utils = require('./../utils/ipfs-utils')
const Node = require('../../src/node')

describe('start:', () => {
  let node

  before(() => {
    node = new Node(utils.config)
  })

  after(() => {
    return node.stop().then(utils.cleanRepo)
  })

  it('from offline to online', () => {
    return node.start().then((id) => {
      expect(id).to.exist
    })
  })
})
