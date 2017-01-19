const nodeFactory = require('../utils/temp-shim-node')

let node
nodeFactory.create(0)
	.then(n => {
		node = n
		return node.startWithOffset()
	})
	.then(() => {
		// console.log('about to subscribe')
		// return node.postShimServer()
		// stored QmbbDaWDyFjpWh258TxEiEQBEoypii8ZBmVhq5x7ijCcCg

		node.subscribe(['QmVjz4L2fW4gXPP5wwDixsh8qPS4pDzorv4EL7rKFadW9p'], (data) => {
			console.log('rceived something', data)
		})

		setTimeout(() => {
			console.log('--------------------------------------------')
			console.log('swarm', node.identity.id)
			console.log('--------------------------------------------')
			console.log('swarm.peers', node._ipfs.swarm.peers().then(console.log))
			console.log('--------------------------------------------')
			console.log('swarm.addrs', node._ipfs.swarm.addrs().then(console.log))
			console.log('--------------------------------------------')
		}, 3000)
	})
	// .then(() => {
	// 	console.log('about to stop')
	// 	// return node.postShimServer()
	// 	return node.stop()
	// })
	// .then(() => {
	// 	console.log('about to get')
	// 	return node.getShimServer(node.identity.id)
	// 	// return node.getShimServer('node.identity.id')
	// })
	// .then((info) => {
	// 	return node.dial(node.identity.id)
	// })
	// .then((info) => {
	// 	console.log('we have success!!', info)
	// })
	// .catch(err => {
	// 	console.log(`HEYOOO err: ${err}`)
	// 	console.log(err.stack)
	// })

