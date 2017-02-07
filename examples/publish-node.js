const nodeFactory = require('../test/utils/temp-node-shim')

let node

nodeFactory.create(5)
  .then((instance) => {
    node = instance
    return node.startWithOffset()
  })
  .then(() => {
    setInterval(() => {
      const foo = new Date().toString()
      console.log('Publishing now:', foo)
      node.publish(foo).catch((err) => console.log('ERROR:', err))
    }, 3000)
  })
  .catch((err) => {
    console.log('Publish error', err)
  })
