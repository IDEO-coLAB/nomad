const ipfsApi = require('ipfs-api')
const R = require('ramda')
const { DAGLink } = require('ipfs-merkle-dag')

const log = require('./log')
const utils = require('./utils')

const ipfs = ipfsApi()

log('WARNING REMOVE NEXT LINE')
let counter = 2
const foo = ipfs.name.resolve

ipfs.name.resolve = () => { 
  if (counter == 0) {
    return foo('Qmf8Ps1gfrkDRXjF2vsBwEbThczvPepSzXUA3yh64aSVD6')
  }
  counter--
  return Promise.reject() 
}

const firstMessage = {
  message: 'hello from Nomad',
  timestamp: new Date().toString()
}

const retryDelays = [1000, 2000, 3000]

const sync = (node) => {
  // TODO: how do we handle if node has no head? let's not error - may be first time publishing
  return resolveNodeHead(node)
    .then((head) => {
      log('Resolved to current object head:', head.Path)
      node.currentDAG.path = head.Path // currently an /ipfs/ object (not ipns)
      return utils.getDAGObjectFromDAGPath(node.currentDAG.path)
    })
    .then((headData) => {
      node.currentDAG.data = headData
      log('Node currentDAG set!')
      return node
    })
    .catch((error) => {
      return Promise.reject({ customSyncError: error })
    })
}

// func must return a promise
const promiseTimeout = (func, time) => {
  return new Promise((resolve, reject) => {
    log('line 40')
    setTimeout(() => {
      log('line 42')
      func()
        .then(() => {
          log('resolving in promiseTimeout')
          resolve()
        })
        .catch(() => {
          log('rejecting in promiseTimeout')
          reject()
        })
    }, 5000)
  })
}

// Tries to call func every few milliseconds
// attemptTimers is array of milliseconds to delay calls
const repeatAttempt = (attemptTimers, func) => {
  if (!R.isArrayLike(attemptTimers)) {
    throw new Error('expected array of times')
  }

  if (R.isEmpty(attemptTimers)) {
    return Promise.reject({ repeatAttempt: 'exhausted attempts' })
  }

  return func()
    .then((data) => {
      log('attempt succeeded')
      return Promise.resolve(data)
    })
    // TODO check whether rejected promise is one of our errors or not
    // if its ours, recurse to retry, if not reject to caller
    .catch((error) => {
      log('attempt failed, timing out')
      log('sleeping with ', R.head(attemptTimers))
      log('recursing with ', R.tail(attemptTimers))
      return promiseTimeout(() => {
        return repeatAttempt( R.tail(attemptTimers), func)
      }, R.head(attemptTimers))
    })
}

const resolveNodeHead = (node) => {
  return ipfs.name.resolve(node.identity.ID)
    .catch((error) => {
      return publishRoot(firstMessage, node)
    })
    .then(() => {
      return repeatAttempt(retryDelays, () => {
        return ipfs.name.resolve(node.identity.ID)
      })
    })  
}

// creates unlinked object with passed data
const createNomadObject = (data) => {
  return Promise.all([ ipfs.object.new(), utils.addDataToIPFS(data) ])
    .then((results) => {
      log('Minted new object and got a new data hash!')
      log('Adding "data" link to data hash...')

      const nextContainerObject = results[0]
      const newFile = R.head(results[1]) // Note: adding a new file returns an array
      const linkToFile = new DAGLink(
        'data',
        newFile.node.data.Size,
        utils.bufferFromBase58(utils.extractMultihashFromPath(newFile.path))
      )
      return ipfs.object.patch.addLink(utils.bufferFromBase58(nextContainerObject.toJSON().Hash), linkToFile)
    })
}

const linkNomadObjects = (sourceDAG, targetDAG) => {
    log('Adding "prev" link!')

    const updatedNextContainerHash = sourceDAG.toJSON().Hash
    const linkToPrev = new DAGLink(
      'prev',
      targetDAG.data.Size,
      utils.bufferFromBase58(utils.extractMultihashFromPath(targetDAG.path))
    )
    return ipfs.object.patch.addLink(utils.bufferFromBase58(updatedNextContainerHash), linkToPrev)
}

const updateIPNS = (dag, node) => {
  return ipfs.object.put(dag)
  .then((putDAG) => {
    log('Publishing new node head...')

    node.currentDAG = Object.assign({}, node.currentDAG, { data: putDAG })
    return ipfs.name.publish(putDAG.toJSON().Hash)
  })
  .then((publishedDAG) => {
    const path = `/ipfs/${publishedDAG.Value}`
    log('Published new node head. New head object can be found at ', path)

    node.currentDAG = Object.assign({}, node.currentDAG, { path })
    return node
  })
}


const publish = (data, node) => {
  log('Minting new object for the next node head...')

  return createNomadObject(data)
    .then((newObject) => {
      return linkNomadObjects(newObject, node.currentDAG)
    })
    .then((linkedObject) => {
      return updateIPNS(linkedObject, node)
    })
    .catch((error) => {
      return Promise.reject({ publishSyncError: error })
    })
}


const publishRoot = (data, node) => {
  log('Minting new root object...')

  return createNomadObject(data)
    .then((newObject) => {
      return updateIPNS(newObject, node)
    })
    .catch((error) => {
      return Promise.reject({ publishRootSyncError: error })
    })
}

module.exports = { sync, publish }

// promiseTimeout(() => { 
//   console.log('worked') 
//   return Promise.reject()
// }, 1000)
