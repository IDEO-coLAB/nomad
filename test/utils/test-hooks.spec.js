// This file contains mocha's global before and after hooks

const utils = require('./../utils/ipfs-utils')

after(() => {
  utils.cleanRepo()
})
