// Sample interface

const Node = require('./src/index')
const node = new Node()

node.connect()
  .then((d) => {
    console.log('DEMO: CONNECTED!!!!')
    return node.publish('Hey there, Gavin!')
  })
  .catch((e) => {
    console.log('DEMO: CONNECT ERROR!!!!', e)
    console.log(e)
    return node.publish('Hey there, Gavin!')
  })
  .then((d) => {
    console.log('DEMO: PUBLLISHED!!!!')
  })
  .catch((e) => {
    console.log('DEMO: PUBLISH ERROR!!!!', e)
  })
