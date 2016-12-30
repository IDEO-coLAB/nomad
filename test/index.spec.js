const R = require('ramda')
const expect = require('chai').expect

const Export = require('./../src')
const Node = require('./../src/node')

describe('Index:', () => {
  describe('exports a valid Node constructor:', () => {
    it('success', () => {
      expect(R.isNil(Export)).to.eql(false)
      expect(typeof Export).to.eql('function')
      const node = new Export()
      expect(node instanceof Node).to.eql(true)
    })
  })
})
