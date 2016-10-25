const Node = require('./../src/node')

const node = new Node()
const MODULE_NAME = `APP`

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
    instance = n
    return instance.publishRoot('Demo sensor is running')
  })
  .catch((err) => {
    log.err(`${MODULE_NAME}: Error publishing root message: ${err}`)
  })
  .then(() => {
    setInterval(() => {
      instance.publish(createMessage())
        .catch((err) => {
          log.err(`${MODULE_NAME}: Error publishing: ${err}`)
        })
    }, 60000)
    return instance.publish('hello!')
  })
  .catch((err) => {
    log.err(`${MODULE_NAME}: Error publishing: ${err}`)
  })
 