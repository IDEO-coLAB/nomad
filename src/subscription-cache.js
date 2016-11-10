const fs = require('fs')

const config = require('./utils/config')
const log = require('./utils/log')
const { NomadError } = require('./utils/errors')

const MODULE_NAME = 'SUBSCRIPTION_CACHE'

const CACHED_SUB_HEADS_PATH = config.path.cachedSubscriptionHeads

const initSubscriptionCache = () => {
  fs.writeFileSync(CACHED_SUB_HEADS_PATH, `${JSON.stringify({})}\r\n`)
  return fs.readFileSync(CACHED_SUB_HEADS_PATH)
}

// Get a link to the subscription link cache
//
// @param {String} id
//
// @return {String || null}
//
const get = (id) => {
  let buffer
  let links
  let subLink

  // If the file doesn't exist, create it
  try {
    buffer = fs.readFileSync(CACHED_SUB_HEADS_PATH)
  } catch (err) {
    buffer = initSubscriptionCache()
  }

  // ensure valid json
  try {
    links = JSON.parse(buffer.toString())
    subLink = links[id]
  } catch (err) {
    subLink = null
  }

  return subLink
}

// Add a link to the subscription link cache
//
// @param {String} id
// @param {String} link
//
const set = (id, link) => {
  log.info(`${MODULE_NAME}: ${id}: Set link ${link}`)

  let links
  // TODO: handle if the file is missing somehow
  const buffer = fs.readFileSync(CACHED_SUB_HEADS_PATH)

  try {
    links = JSON.parse(buffer.toString())
  } catch (err) {
    links = {}
  }

  links[id] = link
  fs.writeFileSync(CACHED_SUB_HEADS_PATH, `${JSON.stringify(links)}\r\n`)

  return link
}

module.exports = {
  get,
  set,
}
