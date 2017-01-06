/**
 * This contains all hooks run after tests end
 */

const cmd = require('./../utils/cmd-runner')

after(() => {
  return Promise.all([
    cmd.cleanRepo(),
    cmd.cleanLocalState()
  ])
})
