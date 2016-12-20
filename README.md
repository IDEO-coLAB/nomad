# Nomad 

> A decentralized platform for open data streams built on IPFS

## Overview 
Nomad is a decentralized system for subscribing to, processing, and publishing data in the form of ordered message streams. Nomad is decentralized: there are no message brokers through which messages pass. Nomad uses [IPFS](http://ipfs.io) to create a peer-to-peer network of nodes that routes messages from publisher to subscriber. Streams are published by nodes which are identified by a public key hash, making Nomad a permissionless system. Anyone can create a new node, subscribe to existing streams, and publish a stream without signing up for any proprietary service.

## Why Nomad?
Data is a beautiful thing, but it's too hard to share live data, to process data and share real time insights, or to connect visualizations to live data. Nomad draws from the likes of stream processing systems like Apache [Kafka](https://kafka.apache.org/) but adds a healthy dose of decentralization to create a global system of durable but lightweight data pipes that anyone can build on top of. 

## Get Started  

### Install
Nomad uses IPFS under the hood. Head to the IPFS distributions page [here](https://dist.ipfs.io/#go-ipfs) and download the binary for your platform. 

After downloading, untar the archive and run the included ```install.sh```:
```console
> tar xvfz go-ipfs.tar.gz
> cd go-ipfs
> ./install.sh
```

Test that IPFS installed successfully:
```console
> ipfs help
USAGE
  ipfs - Global p2p merkle-dag filesystem.
```

Install the Nomad npm module:
> (If you don't have [Node.js](https://nodejs.org/en/download/), install it first.)

```console
npm install --save nomad-stream
```

### Write some code to subscribe to a stream
Subscribe to an existing nomad stream and log its messages to the console:
```javascript
const Nomad = require('nomad-stream')
const nomad = new Nomad()

nomad.subscribe(['QmP2aknMA7RwL7KXyQMvVyiptbhDEgxqe7LiBTffLbtTSR'], function(message) {
  console.log(message.message)
})
```
The string ```QmP2aknMA7RwL7KXyQMvVyiptbhDEgxqe7LiBTffLbtTSR``` is the unique id of the Nomad node to which this node is subscribing. The id is the hash of the public key of the node. ```QmP2ak...``` is a node that publishes a friendly message every minute.

Save your code as ```subscribe.js```

### Start subscribing
Start IPFS:
```console
> ipfs daemon
```

In a new terminal window, start subscribing:
```console
> node subscribe.js
```

> It may take a minute or more before you see any messages.

### 🔥🚀
You just created your first node! What's next? Browse the docs for the complete API. Create a node that publishes something interesting to the world.

### Troubleshooting

Not seeing any messages? Make sure you started IPFS:
```console
ipfs daemon
```

Still having trouble? Kill Node.js, turn on verbose logging, and try again:
```console
> export DEBUG="nomad*"
> node subscribe.js
```

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

```id``` is the node id of the node that published the message, ```link``` is the hash of the IPFS IPLD object that contains the message data, ```message``` is the message string. 

Unsubscribe to a node's stream:
```javascript
nomad.unsubscribe(nodeID)
```

### Publishing
Prepare a node to publish:
```javascript
nomad.prepareToPublish().then(function(n) {
  const nomadInstance = n
})
```
Returns a promise that resolves to an instance object used to publish messages.

Publish a root message:
```javascript
instance.publishRoot(messageString)
```
Publishes a root message to subscribers, which is the first message in the stream of messages. The first time a node is run, publish root must be called once before ```publish``` is called. Published messages must be a string. To published structured data, data needs to be stringified first using ```JSON.stringify```. Returns a promise. 

Publish a message to subscribers:
```javascript
instance.publish(messageString)
```
Publishes a message to subscribers. As with ```publishRoot``` the message must be a string. Returns a promise.

### Node identity
A running node's id comes from the running instance of ipfs started via ```ipfs daemon```. A new identity can be created by either deleting an existing IPFS repo or setting ```IPFS_PATH``` and running ```ipfs init``` again. For details see the IPFS [command line docs](https://ipfs.io/docs/commands/). 

## Caveats
Nomad is alpha software and depends on IPFS which is also alpha software. Things may break at any time. Nomad does not currently include features that support node fault tolerance, but they're in the works!

## Contribute

Feel free to dive in! [Open an issue](https://github.com/ideo-colab/nomad/issues/new) or submit PRs.

## License

MIT (c) IDEO CoLab
