// Sample interface

const Node = require('./src/sensor')
const node = new Node()

node.prepareToPublish()
  .then((node) => {
    console.log('DEMO: CONNECTED!!!!')
    setInterval(() => {
    	node.publish(`At the beep, the time is ${new Date().toString()}. BEEEEEEEEEP`)
    }, 60000)
    return node.publish('Demo sensor is running')
  })
  .catch((e) => {
    console.log('DEMO: CONNECT ERROR!!!!', e)
    console.log(e)
    // return node.publish('Hey there, Gavin!')
  })
  .then((d) => {
    console.log('DEMO: PUBLLISHED!!!!')
  })
  .catch((e) => {
    console.log('DEMO: PUBLISH ERROR!!!!', e)
  })




