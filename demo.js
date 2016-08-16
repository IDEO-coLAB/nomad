let nomad = require('./src/index')

nomad.connect()
  .then((foo) => {
    console.log('connected to ', foo)
  })
  .catch((err) => {
    console.log('Err in demo: ', err)
  })
