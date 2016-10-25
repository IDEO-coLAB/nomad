const child = require('child_process')
const path = require('path')
const log = require('./../../src/utils/log')

const ipfs = 'ipfs'
const repoPath = `${path.resolve(__dirname)}/.ipfs-nomad-test`

let ipfsDaemonHandle = null

function execAndLog(command, options) {
  log.info(child.execSync(command, options).toString())
}

function initIPFS() {
  log.info(`Creating test IPFS repo at ${repoPath}`)
  execAndLog(`${ipfs} init`, { env: { IPFS_PATH: repoPath } })
}

function cleanIPFS() {
  execAndLog(`rm -rf ${repoPath}`)
}

function startIPFSDaemon() {
  ipfsDaemonHandle = child.exec(`${ipfs} daemon`, { env: { IPFS_PATH: repoPath } })
}

function stopIPFSDaemon() {
  ipfsDaemonHandle.kill()
  ipfsDaemonHandle = null
}

function getConfig() {
  return JSON.parse(child.execSync('ipfs config show', { env: { IPFS_PATH: repoPath } }).toString())
}

module.exports = {
  initIPFS,
  cleanIPFS,
  startIPFSDaemon,
  stopIPFSDaemon,
  getConfig,
}
