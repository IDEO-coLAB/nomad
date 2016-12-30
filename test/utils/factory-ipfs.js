const path = require('path')
const IPFS = require('ipfs')
const R = require('ramda')

const cmd = require('./cmd-runner')

module.exports = {
  create: (num) => {
    const trimmedRand = Math.random().toString().substring(2, 8)
    const repo = `${path.resolve(__dirname, 'test-repos')}/.test-ipfs-nomad-repo-${trimmedRand}`
    const ipfsConfig = { emptyRepo: true, bits: 2048 }

    const instance = new IPFS(repo)

    instance.teardown = () => {
      return new Promise((resolve, reject) => {
        instance.goOffline((err) => {
          if (err) {
            throw err
          }
          return resolve()
        })
      })
      .then(() => cmd.cleanRepo(repo))
    }

    instance.start = () => {
      return new Promise((resolve, reject) => {
        instance.goOnline((err) => {
          if (err) {
            throw err
          }
          return resolve(instance)
        })
      })
    }

    return new Promise((resolve, reject) => {
      instance.init(ipfsConfig, (err) => {
        if (err) {
          throw err
        }

        instance.config.get((err, config) => {
          if (err) {
            throw err
          }

          config.Addresses = {
            Swarm: [
              `/ip4/127.0.0.1/tcp/11${num}`,    // defaults to ../tcp/10..
              `/ip4/127.0.0.1/tcp/21${num}/ws`  // defaults to ../tcp/20..
            ],
            API: `/ip4/127.0.0.1/tcp/31${num}`,
            Gateway: `/ip4/127.0.0.1/tcp/32${num}`
          }

          config.Discovery.MDNS.Enabled = false

          instance.config.replace(config, (err) => {
            if (err) {
              throw err
            }

            instance.load((err) => {
              if (err) {
                throw err
              }
              return resolve(instance)
            })
          })
        })
      })
    })
  }
}
