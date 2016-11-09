const fs = require('fs')
const path = require('path')
const R = require('ramda')

const NomadError = require('./errors')

const nodeHeadPath = path.resolve(__dirname, './../../repo/node-head.json')
const subscriptionHeadsPath = path.resolve(__dirname, './../../repo/subscription-heads.json')

const debug = R.equals(typeof process.env.DEBUG, 'boolean') ?
  Boolean(process.env.DEBUG) : false

module.exports = {
  debug,
  path: {
    nodeHead: nodeHeadPath,
    subscriptionHeads: subscriptionHeadsPath
  },
}
