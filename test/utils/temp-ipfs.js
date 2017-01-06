const IPFS = require('ipfs')
const R = require('ramda')
const path = require('path')
const leftPad = require('left-pad')

const cmd = require('./cmd-runner')
const createTempRepo = require('./temp-repo')
const createTempLocalState = require('./temp-local-state')

module.exports = {
  create: (num) => {
    const factoryConfig = {
      repo: createTempRepo(),
      db: createTempLocalState(),
      ipfs: { emptyRepo: true, bits: 2048 }
    }

    const offset = leftPad(num, 3, 0)

    const ipfs = new IPFS(factoryConfig.repo)

    ipfs.teardown = () => {
      return new Promise((resolve, reject) => {
        ipfs.goOffline((err) => {
          if (err) {
            throw err
          }
          return resolve()
        })
      })
      .then(() => cmd.cleanRepo(factoryConfig.repo.path))
    }

    ipfs.start = () => {
      return new Promise((resolve, reject) => {
        ipfs.goOnline((err) => {
          if (err) {
            throw err
          }
          return resolve(ipfs)
        })
      })
    }

    return new Promise((resolve, reject) => {
      ipfs.init(factoryConfig.ipfs, (err) => {
        if (err) {
          throw err
        }

        ipfs.config.get((err, config) => {
          if (err) {
            throw err
          }

          config.Addresses = {
            Swarm: [
              `/ip4/127.0.0.1/tcp/11${offset}`,    // defaults to ../tcp/10..
              `/ip4/127.0.0.1/tcp/21${offset}/ws`  // defaults to ../tcp/20..
            ],
            API: `/ip4/127.0.0.1/tcp/31${offset}`,
            Gateway: `/ip4/127.0.0.1/tcp/32${offset}`
          }

          config.Discovery.MDNS.Enabled = false

          ipfs.config.replace(config, (err) => {
            if (err) {
              throw err
            }

            ipfs.load((err) => {
              if (err) {
                throw err
              }
              return resolve(ipfs)
            })
          })
        })
      })
    })
  }
}
