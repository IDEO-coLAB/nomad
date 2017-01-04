/**
 * This contains all hooks run after tests end
 */

const cmd = require('./../utils/cmd-runner')

after(() => {
  cmd.cleanRepo()
})
