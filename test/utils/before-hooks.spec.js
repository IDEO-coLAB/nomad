/**
 * This contains all hooks run before tests start
 */

const cmd = require('./../utils/cmd-runner')

before(() => {
  cmd.cleanRepo()
})
