// const bs58 = require('bs58')
// const ipfsApi = require('ipfs-api')
// const Q = require('q')
// const R = require('ramda')

// const utils = require('./utils')
// const log = require('./log')

// const ipfs = ipfsApi()

// const RESOLUTION_WAIT_DURATION = 5000

// const resolveOne = (subscription) => {
//   return ipfs.name.resolve(subscription)
//     .then((data) => Promise.resolve({ source: subscription, data }))
//     .catch((error) => Promise.resolve({ source: subscription, error: error.message }))
// }

// const resolveAll = (subscriptions) => {
//   log('Resolving ' + R.length(subscriptions) + ' subscriptions')

//   return Q.allSettled(R.map(resolveOne, subscriptions))
// }

// // Note: expects a list of fulfilled promises (different than successfully resolved! These could be failures)
// const handleResolutionResults = (results, node) => {
//   log('Handling resolution results')

//   R.forEach((con) => {
//     return con.error
//       ? node.subscriptions.disconnected.push(con)
//       : node.subscriptions.connected.push(con)
//     }, R.pluck('value', results))
//   return node
// }



// // UTIL FUNC
// // UTIL FUNC
// // UTIL FUNC

// const rejectTimeout = (func, waitDuration) => {
//   return new Promise((resolve, reject) => {
//     func()
//       .then(resolve)
//       .catch(reject)
//     setTimeout(reject, waitDuration)
//   })
// }

// // UTIL FUNC
// // UTIL FUNC
// // UTIL FUNC


// const getDataObjectDAGsFromSubscriptions = (node) => {
//   const subscriptions = node.subscriptions.connected
//   log('Getting data DAG objects from resolved ' + R.length(subscriptions) + ' subscriptions')

//   return Q.allSettled(R.map((sub) => {
//     return rejectTimeout(() => {
//       return utils.getDAGObjectFromDAGPath(sub.data.Path)
//     }, RESOLUTION_WAIT_DURATION)
//   }, subscriptions))
// }


// // const getDataFromDataObjectDAGs = (results, node) => {
// //   log('Getting actual from data DAG objects')

// //   const headBuffersToFetch = R.map((DAGObject) => R.pluck('hash', DAGObject.links), results)
// //   return Q.all(R.map((buffer) => utils.getDAGObjectDataFromBuffer(buffer), headBuffersToFetch))
// // }

// module.exports.sync = (node) => {
//   return resolveAll(node.config.subscriptions)
//     .then((results) => handleResolutionResults(results, node))
//     .then((node) => getDataObjectDAGsFromSubscriptions(node))
//     // .then((results) => getDataFromDataObjectDAGs(results, node))
//     .then((data) => {
//       console.log('HAVE DAG DATAS!!!!!')
//       console.log('')
//       console.log(data)
//       return node
//     })
//     .catch((error) => {
//       return Promise.reject({ subscribeSyncError: error })
//     })
// }




// // node.on().then((data) +> {
// //   stuff = data[a]

// // })

// // node.on('a').then()
