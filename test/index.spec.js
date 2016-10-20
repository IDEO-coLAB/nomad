const R = require('ramda')
const expect = require('chai').expect

const Node = require('./../src')

describe('Index:', () => {
  describe('exports:', () => {
    it('success', () => {
      expect(R.isNil(Node)).to.eql(false)
      expect(typeof Node).to.eql('function')
    })
  })
})
