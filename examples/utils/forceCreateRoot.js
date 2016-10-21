// Command line script to forcibly create a nomad message and publish under the
// node's IPNS name regardless of what IPNS currently points to

const Node = require('./../node')
const log = require('./log')

const node = new Node()

const message = "Assets to assets, dist to dist"

let instance = null
node.prepareToPublish(false) // prepare identity without syncing message head
  .then((n) => {
    instance = n
    log.info(`writing root message, '${message}'`)
    return instance.publishRoot(message)
  })
  .catch((err) => {
  	log.err(err)
  })

