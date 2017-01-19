const nodeFactory = require('../utils/temp-shim-node')

let node
nodeFactory.create(0)
	.then(n => {
		node = n
		return node.startWithOffset()
	})
	.then(() => {
		return node.postShimServer()
	})
	.then(() => {
		return node.getShimServer(node.identity.id)
	})
	.then((reply) => {
		console.log(reply)
	})
	.catch(err => {
		console.log(`err: ${err}`)
	})

