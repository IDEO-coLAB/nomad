const nodeFactory = require('../utils/temp-shim-node')

let node
const publishLoop = () => {
	return node.publish('this is da message')
	.then(() => {
		return new Promise((resolve, reject) => {
			setTimeout(() => {
				resolve(null)
			}, 5000)
		})
	})
	.then(() => {
		let _node = node
		// debugger
		node._ipfs.swarm.addrs().then(console.log)
		node._ipfs.swarm.peers().then(console.log)
		return publishLoop()
	})
}

nodeFactory.create(0)
	.then(n => {
		node = n
		return node.startWithOffset()
	})
	.then(() => {
		// console.log('about to subscribe')
		// return node.postShimServer()
		// stored QmbbDaWDyFjpWh258TxEiEQBEoypii8ZBmVhq5x7ijCcCg

		node.subscribe(['Qma2CiiFa29b7Gb3tAfjokr5cAevFdcpafvpzwNL9t2xSb'], (data) => {
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
