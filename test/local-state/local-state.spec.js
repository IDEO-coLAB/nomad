const expect = require('chai').expect
const assert = require('chai').assert
const path = require('path')

const LocalState = require('../../src/local-state')
const createTempLocalState = require('../utils/temp-local-state')

const dbPath = createTempLocalState()

describe('local state:', () => {
  const state = new LocalState({ filePath: dbPath })
  const stream1 = 'foo'
  const obj1 = { fookey: 'foovalue' }
  const objUpdate1 = { fookey2: 'foovalueNew' }

  const stream2 = 'bar'
  const obj2 = { barkey: 'barvalue'}

  const stream3 = 'baz'

  it('sets a stream head', () => {
    return state.setHeadForStream(stream1, obj1).then((obj) => {
      expect(obj).to.deep.equal(obj1)
      expect(obj).to.not.deep.equal(obj2)
    })
  })

  it('gets a stream head', () => {
    return state.getHeadForStream(stream1).then((obj) => {
      expect(obj).to.deep.equal(obj1)
      expect(obj).to.not.deep.equal(obj2)
    })
  })

  it('sets another stream head', () => {
    return state.setHeadForStream(stream2, obj2).then((obj) => {
      expect(obj).to.deep.equal(obj2)
      expect(obj).to.not.deep.equal(obj1)
    })
  })

  it('gets another stream head', () => {
    return state.getHeadForStream(stream2).then((obj) => {
      expect(obj).to.deep.equal(obj2)
      expect(obj).to.not.deep.equal(obj1)
    })
  })

  it('gets null when getting a head never set', () => {
    return state.getHeadForStream(stream3)
      .then((obj) => {
        expect(obj).to.equal(null)
    })
  })

  it('updates a stream head', () => {
    return state.setHeadForStream(stream1, objUpdate1)
    .then(() => state.getHeadForStream(stream1))
    .then((obj) => {
      expect(obj).to.eql(objUpdate1)
    })
  })
})
