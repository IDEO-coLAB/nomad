'use strict'

const IPFSRepo = require('ipfs-repo')
const Store = require('fs-pull-blob-store')
const path = require('path')

function createTempRepo (repoPath) {
  const rand = Math.random().toString().substring(2, 8)
  repoPath = repoPath || `${path.resolve(__dirname, 'test-repos')}/.ipfs-nom-repo-${rand}`

  const repo = new IPFSRepo(repoPath, {
    bits: 1024,
    stores: Store
  })

  return repo
}

module.exports = createTempRepo
