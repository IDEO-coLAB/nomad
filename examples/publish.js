const Node = require('./../src/node')

const node = new Node()

// const messages = [
//   () => 'Hello world from the Nomad mothership',
//   () => `At the beep, the time is ${new Date().toString()}`,
//   () => '4, 8, 15, 16, 23, 42',
// ]

let idx = 0

const createMessage = () => {
  // const idx = Math.floor(Math.random() * messages.length)
  // return (messages[idx]())
  return `Message: ${idx++}`
}

let instance = null
node.prepareToPublish()
  // .then((n) => {
  //   instance = n
  //   // console.log('DEMO: CONNECTED!!!!')
  //   return instance.publishRoot('ROOT MESSAGE')
  // })
  // .catch(() => {
  //   log.err('Error publishing root message')
  // })
  .then(() => {
    console.log('READY')
    console.log('DEMO: ROOT PUBLISHED!!!!')
    setInterval(() => {
      instance.publish(createMessage())
    }, 60000)
    return node.publish(createMessage())
  })
  // .catch((err) => {
  //   // log.err('err')
  //   // console.log('DEMO: CONNECT ERROR!!!!', e)
  //   // console.log(e)
  //   // return node.publish('Hey there, Gavin!')
  // })
  // .then(() => {
  //   // console.log('DEMO: PUBLLISHED!!!!', d)
  // })
  .catch(() => {
    // console.log('DEMO: PUBLISH ERROR!!!!', e)
  })
