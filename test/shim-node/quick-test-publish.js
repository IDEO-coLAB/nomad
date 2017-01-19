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
		console.log(node.identity.id)
		return publishLoop()
	})
	.catch(err => {
		console.log(`HEYOOO err: ${err}`)
		console.log(err.stack)
	})
