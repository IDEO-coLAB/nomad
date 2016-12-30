const expect = require('chai').expect

const cmd = require('./../utils/cmd-runner')
const nodeFactory = require('./../utils/factory-node')

describe('isOnline:', () => {
  let node

  before(() => {
    return nodeFactory.create()
      .then((instance) => {
        node = instance
      })
  })

  after(() => {
    return node.teardown()
  })

  it('from offline to online', () => {
    return node.start().then((id) => {
      expect(node.isOnline()).not.to.eql(null)
    })
  })
})
