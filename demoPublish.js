// Sample interface

const Node = require('./src/sensor')
const node = new Node()

let instance = null
node.prepareToPublish()
  .then((n) => {
  	instance = n
  	return instance.publishRoot('Demo sensor is running')
  })
  .then(() => {
  	console.log('DEMO: CONNECTED!!!!')
  	setInterval(() => {
  		instance.publish(`At the beep, the time is ${new Date().toString()}. BEEEEEEEEEP`)
  	}, 60000)
  	return instance.publish('hello!')
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




