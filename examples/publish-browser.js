(() => {

  localStorage.debug = 'libp2p*'

  const DEFAULT_CONFIG = {
    db: ``,
    repo: `publisher`,
    ipfs: { bits: 2048, emptyRepo: true }
  }

  const indexedDB = window.indexedDB ||
          window.mozIndexedDB ||
          window.webkitIndexedDB ||
          window.msIndexedDB

  indexedDB.deleteDatabase(DEFAULT_CONFIG.repo)

  const node = new Nomad(DEFAULT_CONFIG)

  node.start()
    .then(() => {
      setInterval(() => {
        const msg = `The time is now ${new Date().toString()}`
        node.publish(msg)
        console.log('publishing: ', msg)
      }, 3000)
    })

})()