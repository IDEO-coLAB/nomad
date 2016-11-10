const fs = require('fs')
const path = require('path')
const R = require('ramda')

const NomadError = require('./errors')

const userConfigPath = path.resolve(__dirname, './../../nomad.json')
const cachedNodeHeadPath = path.resolve(__dirname, './../../cache/node-head.json')
const cachedSubscriptionHeadsPath = path.resolve(__dirname, './../../cache/subscription-heads.json')

module.exports = {
  path: {
    cachedNodeHead: cachedNodeHeadPath,
    subscriptionHeads: cachedSubscriptionHeadsPath
  },
}
