// Sample interface

const Node = require('./src/sensor')
const node = new Node()

let messages = [
  () => { return 'Hello world from the Nomad mothership' },
  () => { return `At the beep, the time is ${new Date().toString()}` },
  () => { return '4, 8, 15, 16, 23, 42' }
]

const createMessage = () => {
  let idx = Math.floor(Math.random() * messages.length)
  return (messages[idx]())
}

let instance = null
node.prepareToPublish()
  .then((n) => {
  	instance = n
  	return instance.publishRoot('Demo sensor is running')
  })
  .then(() => {
  	console.log('DEMO: CONNECTED!!!!')
  	setInterval(() => {
  		instance.publish(createMessage())
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




