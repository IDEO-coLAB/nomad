const MessageHeaderCache = require('./message-header-cache')
const MessageHeaderWarehouse = require('./message-header-warehouse')

// register callback with flood sub
// get new message
// add to warehouse
// add to cache




class Subscription {
	constructor(id, ipfs, streamHeadState, newMessageCallback) {
		this.ipfs 
		// tracks which messages have been delivered to user
		this.streamHeadState = streamHeadState
		this.newMessageCallback = newMessageCallback
		this.cache = new MessageHeaderCache(ipfs)
		this.warehouse = new MesssageHeaderWarehouse(this.processMessageHeader)
	}

	subscribe() {
		this.ipfs.pubsub.subscribe(this.id, (pubsubMessage) => {
			const header = this.decodePubsubMessage(pubsubMessage)
			this.warehouse.addMessageHeader(header)
		})
	}

	processMessageHeader(header) {}

	decodePubsubMessage(pubsubMessage) {
		console.log(pubsubMessage)
		return {}
	}
}