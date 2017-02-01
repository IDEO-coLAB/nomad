const R = require('ramda')

const MessageHeaderCache = require('../local-state').MessageHeaderCache
const MessageHeaderWarehouse = require('./message-header-warehouse')
const HeaderMessageResolver = require('./header-message-resolver')

// when a new header comes in, follow prev links and deliver
// older messages not yet delivered up to this many
const ITERATION_LIMIT = 1000000

// TODO:
// - need to map message headers to full message
// - logging info and errors
// - stash callback function so we can give it back to ipfs when we disconnect
// - change constructor to accept user new message callback not
// new header callback.

class Subscription {
	constructor (id, ipfs, streamHeadState, newMessageCallback) {
		this.id = id
		this.ipfs = ipfs
		this.streamHeadState = streamHeadState
		this.iterationLimit = ITERATION_LIMIT

		// Set this when the subscription starts
		this.pubsubMessageReceiver = null

		// Message-header and message-header-work stores
		this.cache = new MessageHeaderCache(ipfs)
		this.warehouse = new MessageHeaderWarehouse(this)

		// Find and make sense of on-network messages
		this.headerMessageResolver = new HeaderMessageResolver(id, this.ipfs, newMessageCallback)
	}

	start () {
		// function that pubsub will call on new messages - we need to keep a handle
		// on it to remove it when unsubscribing
		this.pubsubMessageReceiver = (pubsubMessage) => {
			const header = this.decodePubsubMessage(pubsubMessage)
			this.warehouse.addMessageHeader(header)
			this.cache.addMessageHeader(header.multihash, header)
		}
		return this.ipfs.pubsub.subscribe(this.id, this.pubsubMessageReceiver)
	}

	// TODO: is this the right way to unsubscribe?
	// Why does unsubscribe need a ref to ipfsHandler?
	stop () {
		this.ipfs.pubsub.unsubscribe(this.id, this.pubsubMessageReceiver)
		log.info(`${MODULE_NAME}: Unsubscribed from ${this.id}`)
	}

	// tracks which messages have been delivered to user
	setHead (obj) {
		return this.streamHeadState.setHeadForStream(this.id, obj)
	}

	getHead () {
		return this.streamHeadState.getHeadForStream(this.id)
	}

	recursiveFetchHeader (header, lastDeliveredHeader, deliveryQueue) {
		// base cases, end recursion
		// too many iterations
		if (deliveryQueue.length > this.iterationLimit) {
			return Promise.resolve(deliveryQueue)
		}

		// no more previous headers that we haven't processed
		if (header.multihash === lastDeliveredHeader.multihash) {
			return Promise.resolve(deliveryQueue)
		}

		// header is new so add to queue
		const prepended = R.prepend(header, deliveryQueue)

		// header is a new root message
		const prevHeaderLinkObj = header.links.prev
		if (R.isNil(prevHeaderLinkObj)) {
			return Promise.resolve(prepended)
		}

		// this will fetch from the cache or network as needed
		return this.cache.getMessageHeader(prevHeaderLinkObj.multihash)
			.then((prevHeader) => {
				return this.recursiveFetchHeader(prevHeader, lastDeliveredHeader, prepended)
			})
	}

	processMessageHeader (header) {
		return this.getHead()
			.then((lastDeliveredHeader) => {
				if (lastDeliveredHeader && lastDeliveredHeader.data.idx >= header.data.idx) {
					// we've seen this message before
					// delete from the cache because we're dealing with it
					this.cache.deleteMessageHeader(header.multihash)
					return Promise.resolve(null)
				}

				// haven't seen this header before
				if (R.isNil(lastDeliveredHeader)) {
					// this is a new subscription for this node and this is first message
					// don't fetch previous messages, just deliver this one
					this.cache.deleteMessageHeader(header.multihash)
					return this.setHead(header)
						.then(() => {
							this.headerMessageResolver.deliverMessageForHeader(header)
							return Promise.resolve(null)
						})
				}

				// fetch messages between lastDeliveredHeader through header and deliver
				return this.setHead(header)
					.then(() => {
						return this.recursiveFetchHeader(header, lastDeliveredHeader, [])
					})
					.then((deliveryQueue) => {
						R.forEach((_header) => {
							this.cache.deleteMessageHeader(_header.multihash)
							this.headerMessageResolver.deliverMessageForHeader(_header)
						}, deliveryQueue)
						return Promise.resolve(null)
					})
			})
	}

	decodePubsubMessage (pubsubMessage) {
		return JSON.parse(pubsubMessage.data.toString())
	}
}

module.exports = Subscription
