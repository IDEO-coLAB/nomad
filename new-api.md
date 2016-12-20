# Nomad 

> A decentralized platform for open data streams built on IPFS

## Overview 
Nomad is a decentralized system for subscribing to, processing, and publishing data in the form of ordered message streams. Nomad is decentralized: there are no message brokers through which messages pass. Nomad uses [IPFS](http://ipfs.io) to create a peer-to-peer network of nodes that routes messages from publisher to subscriber. Streams are published by nodes which are identified by a public key hash, making Nomad a permissionless system. Anyone can create a new node, subscribe to existing streams, and publish a stream without signing up for any proprietary service.

## Why Nomad?
Data is a beautiful thing, but it's too hard to share live data, to process data and share real time insights, or to connect visualizations to live data. Nomad draws from the likes of stream processing systems like Apache [Kafka](https://kafka.apache.org/) but adds a healthy dose of decentralization to create a global system of durable but lightweight data pipes that anyone can build on top of. 

## Get Started  

### Install for Node.js
Install the Nomad npm module:
> (If you don't have [Node.js](https://nodejs.org/en/download/), install it first.)

```console
npm install --save nomad-stream
```

Require the module:
```javascript
const Nomad = require('nomad-stream')
```

### Use in a browser with a script tag
```html
<script src="https://url/path/to/nomad.js"></script>
```
This makes ```Nomad``` available as a global object.

### Write some code to subscribe to a stream
Subscribe to an existing nomad stream and log its messages to the console:
```javascript
const nomad = new Nomad()
// Nomad constructor creates a new identity for the node so that use cases
// where nomad is used only to subscribe, users don't have to think about creating
// and identity. This would also be likely browser use case.

nomad.subscribe(['QmP2aknMA7RwL7KXyQMvVyiptbhDEgxqe7LiBTffLbtTSR'], function(message) {
  console.log(message.message)
})
```
The string ```QmP2aknMA7RwL7KXyQMvVyiptbhDEgxqe7LiBTffLbtTSR``` is the unique id of the Nomad node to which this node is subscribing. The id is the hash of the public key of the node. ```QmP2ak...``` is a node that publishes a friendly message every minute.

Save your code as ```subscribe.js```

### Start subscribing
```console
> node subscribe.js
```

> It may take a minute or more before you see any messages.

### 🔥🚀
You just created your first node! What's next? Browse the docs for the complete API. Create a node that publishes something interesting to the world.

## Full API

### Initializing
Require module and create a new instance:
```javascript
const Nomad = require('nomad-stream')
const nomad = new Nomad()
```

### Subscribing
Subscribe to one or more nodes' streams:
```javascript
nomad.subscribe(array, callback)
```

```array``` is an array of node ids to subscribe to. ```callback``` is called once when a new message arrives for any subscribed stream. Callback is passed a single argument which is an object:
```javascript
{id, link, message}
```

```id``` is the node id of the node that published the message, ```link``` is the hash of the IPFS IPLD object that contains the message data, ```message``` is the message string. Note that currently, even if a node publishes a JavaScript object, ```message.message``` will still be the stringified JSON of the object.

Unsubscribe to a node's stream:
```javascript
nomad.unsubscribe(nodeID)
```

### Publishing
Nomad uses public keys to identify a node, so before publishing a new identity needs to be created: 
```javascript
const identity = nomad.createIdentity()
nomad.setIdentity(identity)
```

An identity can be saved and loaded from disk, so that a node can keep its identity accross runs:
```javascript
nomad.saveIdentityToFile(identity, '/path/to/file.json')
```

```javascript
const identity = nomad.loadIdentityFromFile('/path/to/file.json')
nomad.setIdentity(identity)
```

A Nomad identity includes a private key, so it should be secured with the same care as a password or api token. 

Publish a message to subscribers:
```javascript
nomad.publish(messageString)
```
Publishes a message to subscribers. The message can be a string or an object that is serializable to JSON.

> suggest we remove publishroot from the api. Calls to publish should check the message cache and if it is in fact a root message, it should automatically create an IPLD object without a ```prev``` link. If a user wants to end a previous stream and start a new stream of messsages (so that following ```prev``` links backwards ends at the root of the new stream) this should be done by manipulating the cache directly either using an api we'd write or command line tools. 

For example ```nomad.clearCache()``` would be the same as publishing a new root, effectively getting rid of previous messages.

At some point we're going to want cache management api or command line tools to do stuff like control how many historical messages in a stream to cache.

## Caveats
Nomad is alpha software and depends on IPFS which is also alpha software. Things may break at any time. Nomad does not currently include features that support node fault tolerance, but they're in the works!

## Contribute

Feel free to dive in! [Open an issue](https://github.com/ideo-colab/nomad/issues/new) or submit PRs.

## License

MIT (c) IDEO CoLab
