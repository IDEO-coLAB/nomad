const child = require('child_process')
const path = require('path')
const log = require('./../../src/utils/log')

const ipfs = 'ipfs'
const repoPath = `${path.resolve(__dirname)}/.ipfs`

let ipfsDaemonHandle = null

function execAndLog(command, options) {
	log.info(child.execSync(command, options).toString())
}

function initIPFS() {
	execAndLog(`${ipfs} init`, {env: {'IPFS_PATH': repoPath}})
}

function cleanIPFS() {
	execAndLog(`rm -rf ${repoPath}`)
}

function startIPFSDaemon() {
	ipfsDaemonHandle = child.exec(`${ipfs} daemon`, {env: {'IPFS_PATH': repoPath}})
}

function stopIPFSDaemon() {
	ipfsDaemonHandle.kill()
	ipfsDaemonHandle = null
}

module.exports = {
	initIPFS,
	cleanIPFS,
	startIPFSDaemon,
	stopIPFSDaemon
}


