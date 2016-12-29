const child = require('child_process')
const path = require('path')
const log = require('./../../src/utils/log')

const MODULE_NAME = 'IPFS UTILS'
const REPO_PATH = `${path.resolve(__dirname, '..')}/.ipfs-nomad-test`

const config = {
  repo: REPO_PATH,
  ipfs: { emptyRepo: true, bits: 2048 }
}

function execAndLog(command, options) {
  log.test(`${MODULE_NAME}: ${command}`)

  return new Promise((resolve, reject) => {
    child.exec(command, options, (err, stdout, stderr) => {
      if (err) {
        return reject(err)
      }
      resolve(stdout)
    })
  })
}

function cleanRepo() {
  return execAndLog(`rm -rf ${REPO_PATH}`)
}

module.exports = {
  repo: REPO_PATH,
  cleanRepo,
  config,
}
