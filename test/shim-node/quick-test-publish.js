const nodeFactory = require('../utils/temp-shim-node')

let node
nodeFactory.create(0)
	.then(n => {
		node = n
		return node.startWithOffset()
	})
	.then(() => {
		console.log('about to publish')
		// return node.postShimServer()
		return node.publish('this is ')
	})
	.then(() => {
		console.log('about to stop')
		// return node.postShimServer()
		return node.stop()
	})
	// .then(() => {
	// 	console.log('about to get')
	// 	return node.getShimServer(node.identity.id)
	// 	// return node.getShimServer('node.identity.id')
	// })
	// .then((info) => {
	// 	return node.dial(node.identity.id)
	// })
	.then((info) => {
		console.log('we have success!!', info)
	})
	.catch(err => {
		console.log(`HEYOOO err: ${err}`)
		console.log(err.stack)
	})

