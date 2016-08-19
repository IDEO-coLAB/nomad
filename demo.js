// Sample interface

const Node = require('./src/index')
const node = new Node()

node.connect()
  .then((d) => {
    console.log('DMEO CODE: CONNECTED!!!!')
    return node.publish('Hey you, Gavin was here and it was working')
  })
  .catch((e) => {
    console.log('DEMO Error: ', e)
    // return node.publish('Hey you, Gavin!!!')
  })
  // .then((node) => {
  //   console.log('DMEO CODE: it was PUBLLISHED', node)
  // })
  // .catch((e) => {
  //   console.log('DEMO Error: ', e)
  // })
