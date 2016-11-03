const Node = require('./../src/node')
// const util = require('util')

const node = new Node()

const processMessages = (err, messages) => {
  if (messages) {
    // console.log('MESSAGES RECEIVED:\n', util.inspect(messages, {depth: null}))
  }
  if (err) {
    // console.log('MESSAGES ERR:\n', err)
  }
  // console.log('MESSAGES RECEIVED!!!!!\n')
  // do something with the messages
}

// subscribes to all sensors in subscriptions list, calls processMessages
// callback when any subscription has a new message. Also calls processMessages
// once with latest message.
node.onMessage(processMessages)
