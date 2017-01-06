const child = require('child_process')
const path = require('path')

const log = require('./../../src/utils/log')

const MODULE_NAME = 'CMD-RUNNER'

const ALL_REPOS_PATH = `${path.resolve(__dirname, 'test-repos')}`

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

function cleanRepo(repoPath) {
  switch (typeof repoPath) {
    case 'string':
      return execAndLog(`rm -rf ${repoPath}`)
      break
    case 'undefined':
      return execAndLog(`rm -rf ${ALL_REPOS_PATH}`)
      break
    default:
      throw new Error(`Failed to recognize 'cleanRepo' argument: ${repoPath}`)
  }
}

module.exports = { cleanRepo }