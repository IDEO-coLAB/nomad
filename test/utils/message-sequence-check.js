// Helps verify a sequence of correct incoming messages for testing
const expect = require('chai').expect
const assert = require('chai').assert
const R = require('ramda')

class MessageSequenceCheck {
	constructor () {
		this.callback = this.callback.bind(this)
	}

	expectInOrder (messageList, done) {
		this.messageList = messageList
		this.done = done
	}

	callback (message) {
		console.log(`got ${message}`)
		console.log(message)

		expect(this.messageList).to.exist
		expect(this.messageList).to.not.be.empty

		const first = R.head(this.messageList)
		this.messageList = R.tail(this.messageList)

		expect(message).to.deep.equal(first)
		if (R.isEmpty(this.messageList)) {
			this.done()
		}
	}
}

module.exports = MessageSequenceCheck
