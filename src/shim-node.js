const _ = require('underscore')
const fetch = require('isomorphic-fetch')
const Node = require('./node')
const log = require('./utils/log')
const path = require('path')

const MODULE_NAME = 'SHIM-NODE'

const DEFAULT_CONFIG = {
  db: `${path.resolve(__dirname)}/.nomad-store`,
  repo: `${path.resolve(__dirname)}/.ipfs-store`,
  ipfs: { emptyRepo: true, bits: 2048 }
}

const SHIM_URL = 'http://10.2.4.186:8000/conn'

module.exports = class ShimNode extends Node {
  // Overrides of Node methods
  constructor (config = DEFAULT_CONFIG) {
    super(config)
    this.postShimServer = _.throttle(this.postShimServer, 10000)
  }

  stop () {
    // delete our peer from the shim server
    return super.stop()
  }

  publish (data) {
    this.postShimServer()
    return super.publish(data)
  }

  subscribe (ids, handler) {
    // get peer info from shim server and dial peer
    super.subscribe(ids, handler)
  }

  // ShimNode only methods

  postShimServer() {
    const thisPeerInfo = this.identity
    console.log(thisPeerInfo)
    return fetch(SHIM_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(thisPeerInfo)
    }).catch(err => {
      console.log(err)
      log.err(err)
    })
  }
}
