const child = require('child_process')
const path = require('path')
const log = require('./../../src/utils/log')

const ipfs = 'ipfs'
const repoPath = `${path.resolve(__dirname, '..')}/.ipfs-nomad-test`

let ipfsDaemonHandle = null

const config = {
  repo: repoPath,
  ipfs: { emptyRepo: true, bits: 2048 }
}

function execAndLog(command, options) {
  log.info(`IPFS test utils: ${command}`)

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
  return execAndLog(`rm -rf ${repoPath}`)
}

module.exports = {
  config,
  repoPath,
  cleanRepo,
}
