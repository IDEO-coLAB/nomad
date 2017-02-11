const IPFS = require('ipfs')
const R = require('ramda')
const path = require('path')
const leftPad = require('left-pad')

const cmd = require('./cmd-runner')
const createTempRepo = require('./temp-repo')
const createTempLocalState = require('./temp-local-state')

const Node = require('../../src/node')
const ipfsDefaultConfig = require('../../src/config/ipfs-config.json')

module.exports = {
  create: (num) => {
    const factoryConfig = {
      repo: createTempRepo(),
      db: createTempLocalState(),
      // ipfs: { emptyRepo: true, bits: 2048 }
    }

    const offset = leftPad(num, 3, 0)

    let node = new Node(factoryConfig)

    // This fn offsets the default ports => needed when running multiple nodes
    // at once. As a result, we use this commanf to start the test nodes and we
    // can skip the typical 'node.start()' call when testing with multiple nodes
    node.startWithOffset = () => {
      let ipfsConfig = JSON.parse(JSON.stringify(ipfsDefaultConfig))

      ipfsConfig.Addresses = {
        // Overwrite the addresses for listening
        Swarm: [
          `/ip4/127.0.0.1/tcp/11${offset}`,    // default was ../tcp/10..
          `/ip4/127.0.0.1/tcp/21${offset}/ws`  // default was ../tcp/20..
        ],
        API: `/ip4/127.0.0.1/tcp/31${offset}`,
        Gateway: `/ip4/127.0.0.1/tcp/32${offset}`
      }

      ipfsConfig.Discovery.MDNS.Enabled = false

      return node.configure({ config: ipfsConfig })
        .then(() => node.start())

      // // Functon to update the config before the new IPFS instance is loaded from it
      // const offsetConfigAddrs = () => {
      //   return new Promise((resolve, reject) => {
      //     node._ipfs.config.get((err, config) => {
      //       if (err) {
      //         throw err
      //       }

      //      config.Addresses = {
      //         Swarm: [
      //           `/ip4/127.0.0.1/tcp/11${offset}`,    // default was ../tcp/10..
      //           `/ip4/127.0.0.1/tcp/21${offset}/ws`  // default was ../tcp/20..
      //         ],
      //         API: `/ip4/127.0.0.1/tcp/31${offset}`,
      //         Gateway: `/ip4/127.0.0.1/tcp/32${offset}`
      //       }

      //       config.Discovery.MDNS.Enabled = false

      //       node._ipfs.config.replace(config, (err) => {
      //         if (err) {
      //           throw err
      //         }
      //         return resolve()
      //       })
      //     })
      //   })
      // }

      // return node._ipfs.initP(node._ipfsConfig.ipfs)
      //   .then(offsetConfigAddrs)
      //   .then(node._loadP)
      //   .then(node._ipfs.goOnlineP)
      //   .then(node._ipfs.id)
      //   .then((id) => {
      //     node.identity = id
      //     return node
      //   })
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
