const fs = require('fs')

const config = require('./utils/config')
const log = require('./utils/log')

const MODULE_NAME = 'SUBSCRIPTION_STORE'

const SUB_HEADS_PATH = config.path.subscriptionHeads

// Get a link to the subscription link cache
//
// @param {String} id
//
// @return {String} || null
//
const get = (id) => {
  const buffer = fs.readFileSync(SUB_HEADS_PATH)
  const links = JSON.parse(buffer.toString())
  return links[id] || null
}

// Add a link to the subscription link cache
//
// @param {String} id
// @param {String} link
//
const put = (id, link) => {
  log.info(`${MODULE_NAME}: Adding link (${link}) for ${id}`)
  const buffer = fs.readFileSync(SUB_HEADS_PATH)
  const links = JSON.parse(buffer.toString())
  links[id] = link
  fs.writeFileSync(SUB_HEADS_PATH, `${JSON.stringify(links)}\r\n`)
}

module.exports = { get, put, }
