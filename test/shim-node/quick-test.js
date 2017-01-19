const ShimNode = require('../../src/shim-node')

const node = new ShimNode()
node.start()
	.then(() => {
		return node.postShimServer()
	})
	.then(() => {
		console.log('posted...')
		return node.stop()
	})
	.catch(err => {
		console.log(`err: ${err}`)
	})

