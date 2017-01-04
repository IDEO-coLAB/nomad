module.exports = (instance) => {
  instance.initP = (config) => {
    return new Promise((resolve, reject) => {
      instance.init(config, (err) => {
        if (err) {
          throw err
        }
        resolve()
      })
    })
  }

  instance.loadP = () => {
    return new Promise((resolve, reject) => {
      return instance.load((err) => {
        if (err) {
          return reject(err)
        }
        resolve()
      })
    })
  }

  instance.goOnlineP = () => {
    return new Promise((resolve, reject) => {
      instance.goOnline((err) => {
        if (err) {
          return reject(err)
        }
        resolve()
      })
    })
  }

  instance.goOfflineP = () => {
    return new Promise((resolve, reject) => {
      instance.goOffline((err) => {
        if (err) {
          return reject(err)
        }
        resolve()
      })
    })
  }

  return instance
}
