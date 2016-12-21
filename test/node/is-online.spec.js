const expect = require('chai').expect

const utils = require('./../utils/ipfs-utils')
const Node = require('./.././../src/node')

describe('isOnline:', () => {
  let node

  before(() => {
    node = new Node(utils.config)
  })

  after(() => {
    return node.stop().then(utils.cleanRepo)
  })

  it('from offline to online', () => {
    return node.start().then((id) => {
      expect(node.isOnline()).not.to.eql(null)
    })
  })
})
