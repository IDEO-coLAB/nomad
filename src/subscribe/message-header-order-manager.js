const R = require('ramda')
const log = require('../utils/log')
const MessageWarehouse = require('./message-warehouse')

class SubscriptionManager {
  constructor(node) {
    this.node = node
    this.warehouse = new MessageWarehouse(this.orderAndDeliverMessageToUser)
  }

  orderAndDeliverMessageToUser(pubID, hash, message) {
    console.log('delivering...')
    return Promise.resolve(null)
  }

  receiveMessageFromNetwork(pubID, hash, message) {
    this.warehouse.addMessage(pubID, hash, message)
  }
}







