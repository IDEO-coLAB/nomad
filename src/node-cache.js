const fs = require('fs')

const config = require('./utils/config')
const log = require('./utils/log')

const MODULE_NAME = 'NODE_CACHE'

const CACHED_HEAD_PATH = config.path.cachedNodeHead

// Create a new file to act as the cache for the node's head
//
// @return {Bool}
//
const initHeadCache = () => {
  fs.writeFileSync(CACHED_HEAD_PATH, '\r\n')
  return true
}

// Get the latest node head from the cache
//
// @return {Object || null}
//
module.exports.getHead = () => {
  let buffer
  let head

  // Ensure the cache file exists
  // create an empty one if it doesn't
  try {
    buffer = fs.readFileSync(CACHED_HEAD_PATH)
  } catch(err) {
    initHeadCache()
  }
  buffer = fs.readFileSync(CACHED_HEAD_PATH)

  // Ensure the file contains valid json
  try {
    head = JSON.parse(buffer.toString())
    log.info(`${MODULE_NAME}: Head found`)
  } catch(err) {
    head = null
    log.info(`${MODULE_NAME}: No head found`)
  }

  return head
}

// Set the node head in a cache
//
// @return {Object || null}
//
module.exports.setHead = (head) => {
  try {
    fs.writeFileSync(CACHED_HEAD_PATH, JSON.stringify(head))
  } catch(err) {
    initHeadCache()
  }
  fs.writeFileSync(CACHED_HEAD_PATH, JSON.stringify(head))
  log.info(`${MODULE_NAME}: Head set`)
  return true
}
