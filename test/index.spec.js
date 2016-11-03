const R = require('ramda')
const expect = require('chai').expect

const Exported = require('./../src')
const Node = require('./../src/node')

describe('Index:', () => {
  describe('exports a valid Node constructor:', () => {
    it('success', () => {
      expect(R.isNil(Exported)).to.eql(false)
      expect(typeof Exported).to.eql('function')
      const node = new Exported()
      expect(node instanceof Node).to.eql(true)
    })
  })
})
