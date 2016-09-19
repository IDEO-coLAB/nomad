// Sample interface

const Node = require('./src/sensor')
const node = new Node()

// node.prepareToPublish()
//   .then((node) => {
//     console.log('DEMO: CONNECTED!!!!')
//     return node.publish('Test before push')
//   })
//   .catch((e) => {
//     console.log('DEMO: CONNECT ERROR!!!!', e)
//     console.log(e)
//     // return node.publish('Hey there, Gavin!')
//   })
//   .then((d) => {
//     console.log('DEMO: PUBLLISHED!!!!')
//   })
//   .catch((e) => {
//     console.log('DEMO: PUBLISH ERROR!!!!', e)
//   })

let processMessages = (messages) => {
  // messages is object keyed by sensor hash

}

// subscribes to all sensors in subscriptions list, calls processMessages
// callback when any subscription has a new message. Also calls processMessages
// once with latest message.
node.subscribe(processMessages)


