const IPFS = require('ipfs')
const R = require('ramda')
const path = require('path')

const cmd = require('./cmd-runner')
const Node = require('../../src/node')

module.exports = {
  create: () => {
    const trimmedRand = Math.random().toString().substring(2, 8)
    const config = {
      repo: `${path.resolve(__dirname, 'test-repos')}/.test-ipfs-nomad-repo-${trimmedRand}`,
      ipfs: { emptyRepo: true, bits: 2048 }
    }

    node = new Node(config)

    node.teardown = () => {
      return node.stop()
        .then(() => cmd.cleanRepo(config.repo))
    }

    return Promise.resolve(node)
  }
}
