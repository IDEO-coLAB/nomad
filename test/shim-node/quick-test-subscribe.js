const nodeFactory = require('../utils/temp-shim-node')

let node
nodeFactory.create(1)
	.then(n => {
		node = n
		return node.startWithOffset()
	})
	.then(() => {
		return node.subscribe(['QmbD94QKUy8b974up2kNg9VGCGQV3epN9YW2ZE3e5Qm45b'], () => {})
	})
	.catch(err => {
		console.log(`err: ${err}`)
	})

