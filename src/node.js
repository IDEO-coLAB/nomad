const fs = require('fs')
const R = require('ramda')
const taskQueue = require('task-queue')

const Subscription = require('./subscription')
// const { getLatest } = require('./subscribe')
// const messageStore = require('./message-store')

const { publish, publishRoot } = require('./publish')
const log = require('./utils/log')
const config = require('./utils/config')
const { id } = require('./utils/ipfs')
const errors = require('./utils/errors')

const MODULE_NAME = 'SENSOR'

const NODE_HEAD_PATH = config.path.head

// How often to poll for new subscription messages
// TODO: maybe move this into subscription.js
const POLL_MILLIS = 1000 * 10

// Errors considered fatal; these are used to determine if the error
// should kill the process
const fatalErrors = [errors.IPFSErrorDaemonOffline]

// Determine if an error is an instance of, what we've determined
// to be, fatal errors
//
// @param {Object} err
//
// @return {Bool}
//
const instanceOfFatalErrors = (err) => {
  const matchedErrors = R.find(errorClass => err instanceof errorClass, fatalErrors)
  return !R.isNil(matchedErrors)
}

// Handle 'fatal' errors or pass them along
//
// @param {Object} err
//
// @return {Promise} nomad error object
//
const passErrorOrDie = (err) => {
  if (err instanceof errors.NomadError) {
    log.err(`${MODULE_NAME}: ${err.toErrorString()}`)
  } else {
    log.err(`${MODULE_NAME}: ${err}`)
  }

  if (instanceOfFatalErrors(err)) {
    log.err(`${MODULE_NAME}: fatal error`)
    log.err(`${MODULE_NAME}: exiting`)
    process.exit(1)
  }

  return Promise.reject(err)
}

// Class: Node
//
module.exports = class Node {
  constructor() {
    this.isAtomic = config.isAtomic
    this.isOnline = false
    this.identity = null




    this.subscriptions = R.mapObjIndexed((sub, subId) => new Subscription(subId), config.subscriptions)
    // this.messages = messageStore





    // this.tasks = new taskQueue.Queue({ capacity: 5, concurrency: 1 })
    // this.tasks.start()



    // Try setting the node head from disk
    this.head = { DAG: null, path: null }
    try {
      // TODO: create file if it does not exist
      const buffer = fs.readFileSync(NODE_HEAD_PATH)
      // TODO: test if it has the correct properties
      this.head = JSON.parse(buffer.toString())
      log.info(`${MODULE_NAME}: Set node head from disk`)
    } catch (err) {
      log.info(`${MODULE_NAME}: No existing node head on disk`)
    }
  }

  // Connect the sensor to the network and set the node's identity
  //
  // @return {Promise} Node
  //
  prepareToPublish() {
    log.info(`${MODULE_NAME}: Connecting sensor to the network`)

    return id()
      .then((identity) => {
        log.info(`${MODULE_NAME}: IPFS daemon is running with ID: ${identity.ID}`)

        this.identity = identity
        this.isOnline = true
        return this
      })
      .catch(passErrorOrDie)
  }

  // Publish data to the network
  //
  // @param {Object} data
  //
  // @return {Promise} Node
  //
  publish(data) {
    log.info(`${MODULE_NAME}: Publishing new data`)
    return publish(data, this).catch(passErrorOrDie)
  }

  // Publish the node's data root to the network
  //
  // @param {Object} data
  //
  // @return {Promise} Node
  //
  publishRoot(data) {
    log.info(`${MODULE_NAME}: Publishing new root`)
    return publishRoot(data, this).catch(passErrorOrDie)
  }









  // Handle all newly received subscription messages by passing the recent data
  // to a user-defined callback
  //
  // @param {Func} cb
  //
  onMessage(cb) {
    log.info(`${MODULE_NAME}: Registering handlers for ${R.length(R.keys(this.subscriptions))} subscriptions`)

    console.log(this.subscriptions)


    let b = () => {}



    console.log(R.indexOf(b, foo))








    // const handleMessages = () => {
    //   getLatest(this.subscriptions)
    //     .then(messages => cb(null, messages))
    //     .catch(passErrorOrDie)
    //     .catch(cb)
    // }

    // handleMessages()

    // this.subscribePollHandle = setInterval(() => {
    //   if (this.tasks.size() < 1) {
    //     // only poll if the previous poll finished, otherwise wait until next pass through
    //     this.tasks.enqueue(handleMessages, { args: [] })
    //   } else {
    //     log.info(`skipping poll because task queue has length ${this.tasks.size()}`)
    //   }
    // }, POLL_MILLIS)
  }
}
