const expect = require('chai').expect

const MessageCache = require('../../src/local-state').MessageCache

describe('message-cache', () => {
  const cache = new MessageCache()
  const hash1 = 'abc123'
  const message1 = {fookey: 'foovalue'}

  const hash2 = 'def123'
  const message2 = {fookey: 'foovalue2'}

  it('adds and gets a message from the cache', () => {
    cache.addMessage(hash1, message1)
    const m = cache.getMessage(hash1)
    expect(message1).to.deep.equal(m)
  })

  it('adds and gets another message from the cache', () => {
    cache.addMessage(hash2, message2)
    const m = cache.getMessage(hash2)
    expect(message2).to.deep.equal(m)
  })

  it('deletes a message from the cache and tries to get it', () => {
    cache.deleteMessage(hash1)
    const m = cache.getMessage(hash1)
    expect(m).to.equal(undefined)
  })
})
