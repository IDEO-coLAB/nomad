const IPFS = require('ipfs')
const R = require('ramda')
const path = require('path')
const leftPad = require('left-pad')

const cmd = require('./cmd-runner')
const createTempRepo = require('./temp-repo')
const createTempLocalState = require('./temp-local-state')
const ShimNode = require('../../src/node-shim')
// const sigServConfig = require('../../src/config/signal-server-config.json')
// const ipfsDefaultConfig = require('../../src/config/ipfs-default-config.json')
// const { webRTCMultiAddr } = require('../../src/utils/ipfs-strings')

module.exports = {
  create: (num) => {
    const factoryConfig = {
      repo: createTempRepo(),
      db: createTempLocalState(),
      ipfs: { emptyRepo: true, bits: 2048 }
    }

    const offset = leftPad(num, 3, 0)

    let node = new ShimNode(factoryConfig)

    // This fn offsets the default ports => needed when running multiple nodes
    // at once. As a result, we use this command to start the test nodes and we
    // can skip the typical 'node.start()' call when testing with multiple nodes
    node.startWithOffset = () => {
      // Functon to update the config before the new IPFS instance is loaded from it
      const offsetConfigAddrs = () => {
        return new Promise((resolve, reject) => {
          node._ipfs.config.get((err, config) => {
            if (err) {
              throw err
            }

            // const webRTCAddr = webRTCMultiAddr(sigServConfig.IP, sigServConfig.port, config.Identity.PeerID)

            // Swarm addresses are empty because shim-node will add them for WebRTCStar transport
            config.Addresses = {
              // Swarm: [ webRTCAddr ],
              API: `/ip4/127.0.0.1/tcp/31${offset}`,
              Gateway: `/ip4/127.0.0.1/tcp/32${offset}`
            }

            config.Discovery.MDNS.Enabled = false

            node._ipfs.config.replace(config, (err) => {
              if (err) {
                throw err
              }
              return resolve()
            })
          })
        })
      }

      return node._ipfs.initP(node._ipfsConfig.ipfs)
        .then(offsetConfigAddrs)
        .then(node._loadP)
        .then(node._ipfs.goOnlineP)
        .then(node._ipfs.id)
        .then((id) => {
          node.identity = id
          return node
        })
      //   .then(node.configureWebRTCStar)
    }

    node.teardown = () => {
      return node.stop()
        .then(() => {
          return Promise.all([
            cmd.cleanRepo(factoryConfig.repo.path),
            cmd.cleanLocalState(factoryConfig.repo.db)
          ])
        })
    }

    return Promise.resolve(node)
  }
}
