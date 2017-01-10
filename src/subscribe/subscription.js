const R = require('ramda')

const log = require('../utils/log')
const MessageHeaderCache = require('../local-state').MessageHeaderCache
const MessageHeaderWarehouse = require('./message-header-warehouse')
const HeaderMessageResolver = require('./header-message-resolver')

// TODO:
// - need to map message headers to full message
// - logging info and errors
// - stash callback function so we can give it back to ipfs when we disconnect
// - change constructor to accept user new message callback not
// new header callback.

// when a new header comes in, follow prev links and deliver
// older messages not yet delivered up to this many
const ITERATION_LIMIT = 1000000

const MODULE_NAME = 'SUBSCRIPTION'

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
		this.headerMessageResolver = new HeaderMessageResolver(this.ipfs, newMessageCallback)
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
		log.info(`${MODULE_NAME}: Recursively fetching header`)

		// Base case: surpased max iterations
		if (deliveryQueue.length > this.iterationLimit) {
			log.warn(`${MODULE_NAME}: Reached iteration limit (${this.iterationLimit})`)
			return Promise.resolve(deliveryQueue)
		}

		// The header is new, add it to the delivery queue
		const prepended = R.prepend(header, deliveryQueue)
		log.info(`${MODULE_NAME}: Adding ${header.multihash} to the delivery queue`)

		// Base case: the header is a new root message
		const prevHeaderLinkObj = (R.find(R.propEq('name', 'prev'))(header.links))
		if (R.isNil(prevHeaderLinkObj)) {
			log.info(`${MODULE_NAME}: ${header.multihash} is a new root`)
			return Promise.resolve(prepended)
		}

		// Base case: we already processed/delivered the new header's link object's 'prev' link
		if (prevHeaderLinkObj.multihash === lastDeliveredHeader.multihash) {
			log.info(`${MODULE_NAME}: Already delivered ${header.multihash}'s previous link`)
			return Promise.resolve(prepended)
		}

		// this will fetch from the cache or network as needed
		log.info(`${MODULE_NAME}: Recursing into ${prevHeaderLinkObj.multihash}`)
		return this.cache.getMessageHeader(prevHeaderLinkObj.multihash)
			.then((prevHeader) => {
				return this.recursiveFetchHeader(prevHeader, lastDeliveredHeader, prepended)
			})
	}

	processMessageHeader (header) {
		return this.getHead()
			.then((lastDeliveredHeader) => {
				// Already received and delivered this header
				if (lastDeliveredHeader && lastDeliveredHeader.data.idx >= header.data.idx) {
					// delete from the cache because we're dealing with it
					log.info(`${MODULE_NAME}: Previously received ${header.multihash} - skipping delivery`)
					this.cache.deleteMessageHeader(header.multihash)
					return Promise.resolve(null)
				}

				// We have no header in the cache, this is a new root (a node's first message)
				if (R.isNil(lastDeliveredHeader)) {
					log.info(`${MODULE_NAME}: ${header.multihash} is a new root`)
					// don't fetch previous messages, just deliver this one
					return this.setHead(header)
						.then(() => {
							this.headerMessageResolver.deliverMessageForHeader(header)
							return Promise.resolve(null)
						})
				}

				// fetch messages between lastDeliveredHeader through header and deliver
				log.info(`${MODULE_NAME}: New header (${header.multihash}) is out of sync with last delivered header (${lastDeliveredHeader.multihash})`)
				return this.setHead(header)
					.then(() => {
						return this.recursiveFetchHeader(header, lastDeliveredHeader, [])
					})
					.then((deliveryQueue) => {
						log.info(`${MODULE_NAME}: Attempting delivery of (${R.length(deliveryQueue)} messages...`)
						R.forEach((_header) => {
							this.cache.deleteMessageHeader(_header.multihash)
							this.headerMessageResolver.deliverMessageForHeader(_header)
						}, deliveryQueue)
						log.info(`${MODULE_NAME}: Delivered ${R.length(deliveryQueue)} messages`)
						return Promise.resolve(null)
					})
			})
	}

	decodePubsubMessage (pubsubMessage) {
		return JSON.parse(pubsubMessage.data.toString())
	}
}

module.exports = Subscription
