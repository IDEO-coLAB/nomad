'use strict'

const path = require('path')

function createTempLocalState (repoPath) {
  const rand = Math.random().toString().substring(2, 8)
  return `${path.resolve(__dirname, 'test-local-state')}/.nom-local-state-${rand}`
}

module.exports = createTempLocalState
