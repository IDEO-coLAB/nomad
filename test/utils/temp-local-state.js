'use strict'

const path = require('path')
const os = require('os')

function createTempLocalState () {
  const rand = Math.random().toString().substring(2, 8)
  return path.resolve(os.tmpdir(), `nom-local-state-${rand}`)
}

module.exports = createTempLocalState
