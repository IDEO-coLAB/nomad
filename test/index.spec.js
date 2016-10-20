const R = require('ramda')
const expect = require('chai').expect

const Exported = require('./../src')

describe('Index:', () => {
  describe('exports:', () => {
    it('success', () => {
      expect(R.isNil(Exported)).to.eql(false)
      expect(typeof Exported).to.eql('function')
    })
  })
})
