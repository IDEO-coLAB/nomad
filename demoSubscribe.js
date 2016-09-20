// Sample interface

const Node = require('./src/sensor')
const node = new Node()

let processMessages = (messages) => {
  console.log('MESSAGES RECEIVED:\n', messages)
}

// subscribes to all sensors in subscriptions list, calls processMessages
// callback when any subscription has a new message. Also calls processMessages
// once with latest message.
node.subscribe(processMessages)


