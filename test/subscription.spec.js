const expect = require('chai').expect

const Subscription = require('./../src/subscription')

describe('Subscription:', () => {
  const handlerA = () => {}
  let removeHandlerA

  let subscription
  let subscriptionId = 'someId'

  before(() => {})
  after(() => {})

  describe('constructor:', () => {
    it('success', () => {
      subscription = new Subscription(subscriptionId)
      expect(subscription).to.exist
    })
  })

  describe('addHandler:', () => {
    it('success', () => {
      // returns a remove handler
      removeHandlerA = subscription.addHandler(handlerA)
      expect(subscription._handlers.length).to.eql(1)
      expect(typeof removeHandlerA).to.eql('function')
    })
  })

  describe('_removeHandler:', () => {
    it('success', () => {
      removeHandlerA()
      expect(subscription._handlers.length).to.eql(0)
    })
  })
})
