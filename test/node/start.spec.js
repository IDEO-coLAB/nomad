const expect = require('chai').expect

const cmd = require('./../utils/cmd-runner')
const nodeFactory = require('./../utils/temp-node')

describe('start:', () => {
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

  // FIXME: this test is kinda weird because temp-node factory starts the node.
  it('from offline to online', () => {
    return node.start().then((id) => {
      expect(id).to.exist
    })
  })
})
