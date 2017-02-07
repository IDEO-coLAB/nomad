'use strict'

const peerId = require('peer-id')
const waterfall = require('async/waterfall')
const parallel = require('async/parallel')

const addDefaultAssets = require('../../node_modules/ipfs/src/core/components/init-assets')

const SIGNAL_SERVER_IP = '138.197.196.251'
const SIGNAL_SERVER_PORT = '10000'

// helper function to construct multiaddress strings
const multiAddrString = (ip, port, peerId) => {
  return `/libp2p-webrtc-star/ip4/${ip}/tcp/${port}/ws/ipfs/${peerId}`
}

module.exports = (instance) => {
  // Current repo version
  const VERSION = '3'

  instance.init = (opts, callback) => {
      if (typeof opts === 'function') {
        callback = opts
        opts = {}
      }

      const self = instance

      opts.emptyRepo = opts.emptyRepo || false
      opts.bits = Number(opts.bits) || 2048
      opts.log = opts.log || function () {}
      opts.privKey = opts.privKey || null

      let config
      // Pre-set config values.
      try {
        config = require('../../node_modules/ipfs/src/init-files/default-config.json')
      } catch (err) {
        return callback(err)
      }

      waterfall([
        // Verify repo does not yet exist.
        (cb) => self._repo.exists(cb),
        (exists, cb) => {
          if (exists === true) {
            return cb(new Error('repo already exists'))
          }

          // Generate peer identity keypair + transform to desired format + add to config.
          opts.log(`generating ${opts.bits}-bit RSA keypair...`, false)

          if (opts.privKey) {
            peerId.createFromPrivKey(opts.privKey, cb)
          } else {
            peerId.create({bits: opts.bits}, cb)
          }
        },
        (keys, cb) => {
          config.Identity = {
            PeerID: keys.toB58String(),
            PrivKey: keys.privKey.bytes.toString('base64')
          }

          config.Addresses.Swarm = config.Addresses.Swarm.concat([ multiAddrString(SIGNAL_SERVER_IP, SIGNAL_SERVER_PORT, config.Identity.PeerID) ])

          opts.log('done')
          opts.log('peer identity: ' + config.Identity.PeerID)

          self._repo.version.set(VERSION, cb)
        },
        (cb) => self._repo.config.set(config, cb),
        (cb) => {
          if (opts.emptyRepo) {
            return cb(null, true)
          }

          const tasks = [
            // add empty unixfs dir object (go-ipfs assumes this exists)
            (cb) => self.object.new('unixfs-dir', cb)
          ]

          if (typeof addDefaultAssets === 'function') {
            tasks.push(
              (cb) => addDefaultAssets(self, opts.log, cb)
            )
          }

          parallel(tasks, (err) => {
            if (err) {
              return cb(err)
            }

            cb(null, true)
          })
        }
      ], callback)
  }

  return instance
}

