const Node = require('./../src/node')

const node = new Node()

const processMessages = () => {
  // console.log('MESSAGES RECEIVED:\n', messages)
  // do something with the messages
}

// subscribes to all sensors in subscriptions list, calls processMessages
// callback when any subscription has a new message. Also calls processMessages
// once with latest message.
node.subscribe(processMessages)
