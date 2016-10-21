const Node = require('./../src/node')

const node = new Node()

const messages = [
  () => 'Hello world from the Nomad mothership',
  () => `At the beep, the time is ${new Date().toString()}`,
  () => '4, 8, 15, 16, 23, 42',
]

const createMessage = () => {
  const idx = Math.floor(Math.random() * messages.length)
  return (messages[idx]())
}

let instance = null
node.prepareToPublish()
  .then((n) => {
    debugger
    instance = n
    console.log('DEMO: CONNECTED!!!!')
    return instance.publishRoot('Demo sensor is running')
  })
  .catch(() => {
    log.err('Error publishing root message')
  })
  .then(() => {
    console.log('DEMO: ROOT PUBLISHED!!!!')
    setInterval(() => {
      instance.publish(createMessage())
    }, 60000)
    return instance.publish('hello!')
  })
<<<<<<< HEAD
  .catch((err) => {
    log.err('err')
    // console.log('DEMO: CONNECT ERROR!!!!', e)
    // console.log(e)
    // return node.publish('Hey there, Gavin!')
  })
  .then(() => {
    // console.log('DEMO: PUBLLISHED!!!!', d)
  })
  .catch(() => {
    // console.log('DEMO: PUBLISH ERROR!!!!', e)
  })
