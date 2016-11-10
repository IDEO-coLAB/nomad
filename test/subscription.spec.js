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
})
