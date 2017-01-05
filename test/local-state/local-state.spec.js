const LocalState = require('../../src/local-state')
const expect = require('chai').expect
const assert = require('chai').assert
const path = require('path')
const os = require('os')

const ostemp = os.tmpdir()
const dbPath = path.resolve(
  ostemp, 
  `.nomad-state-db-${Math.random().toString().substring(2, 8)}`)

console.log(dbPath)

describe('local state:', () => {
  const state = new LocalState({ filePath: dbPath })
  const stream1 = 'foo'
  const obj1 = { fookey: 'foovalue' }

  const stream2 = 'bar'
  const obj2 = { barkey: 'barvalue'}

  const stream3 = 'baz'

  it('sets a stream head', () => {
    return state.setHeadForStream(stream1, obj1).then((obj) => {
      // console.log(obj)
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
})
