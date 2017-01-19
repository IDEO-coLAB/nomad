const nodeFactory = require('../utils/temp-shim-node')

let node
nodeFactory.create(0)
	.then(n => {
		node = n
		return node.startWithOffset()
	})
	.then(() => {
		console.log('about to post')
		return node.postShimServer()
	})
	// .then(() => {
	// 	console.log('about to get')
	// 	return node.getShimServer(node.identity.id)
	// 	// return node.getShimServer('node.identity.id')
	// })
	.then((info) => {
		return node.dial(node.identity.id)
	})
	.then((info) => {
		console.log('HEY we dialed successfully', info)
	})
	.catch(err => {
		console.log(`HEYOOO err: ${err}`)
		console.log(err.stack)
	})

