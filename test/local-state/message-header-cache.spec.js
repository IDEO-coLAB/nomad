const expect = require('chai').expect
const MessageHeaderCache = require('../../src/local-state').MessageHeaderCache
const ipfsFactory = require('../utils/temp-ipfs')

// TODO FIXME: I think files.add is adding additional characters, need to create empty object and patch data field

describe('message-header-cache', () => {
  let ipfs
  let cache

  let hash3
  const messageHeader3 = [0]
  const buf = new Buffer(JSON.stringify(messageHeader3))

  before(() => {
    return ipfsFactory.create(0)
      .then((_ipfs) => {
        ipfs = _ipfs
        return ipfs.start()
      })
      .then(() => {
        cache = new MessageHeaderCache(ipfs)
        return ipfs.files.add(buf)
      })
      .then((obj) => {
        hash3 = obj[0].hash
        return Promise.resolve(null)
      })
  })

  after(() => {
    return ipfs.teardown()
  })

  const hash1 = 'abc123'
  const messageHeader1 = {fookey: 'foovalue'}

  const hash2 = 'def123'
  const messageHeader2 = {fookey: 'foovalue2'}

  it('adds and gets a message from the cache', () => {
    cache.addMessageHeader(hash1, messageHeader1)
    return cache.getMessageHeader(hash1).then((m) => {
      expect(messageHeader1).to.deep.equal(m)
    })
  })

  it('adds and gets another message from the cache', () => {
    cache.addMessageHeader(hash2, messageHeader2)
    return cache.getMessageHeader(hash2).then((m) => {
      expect(messageHeader2).to.deep.equal(m)
    })
  })

  it('misses the cache and fetches a header from ipfs', () => {
    return cache.getMessageHeader(hash3).then((m) => {
      const msg = m.data.toString()
      expect(msg).to.deep.equal(messageHeader3)
    })
  })
})
