/* Local state operations include tracking which nodes a node is subscribed
to, which messages (for each subscription) have been delivered to user code,
and any user code local state that needs to persist accross process failures. */


// SUBSCRIPTIONS

// get existing subscriptions
// remove subscription from cache
// get head hash for existing subscription
// set head hash for existing subscription
// clear head hash for existing subscription

// PUBLISHING



// LOCAL STATE
// For a later rev?
// get arbitrary data
// put arbitrary data

// FAULT TOLERANT LIFECYCLE
// startBatch: marks the beginning of a series of operations that should be atomic
// endBatch: marks the end of a series of operations that should be atomic
// A batch should be persisted atomically. This may only be relevant in Node.js not browser

const objectStore = {
	streams: {}
}

const getHeadForStream = (streamHash) => {
	return objectStore.streams[streamHash]
}

const setHeadForStream = (streamHash, objectHash) => {
	objectStore.streams[streamHash] = objectHash
	return objectHash
}

module.exports = {
	getHeadForStream,
	setHeadForStream
	// clearHeadForStream
}



