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

nomad.subscribe(['QmQRft1pewqjDGbUYQBZwmQ2GNX99djVGTKfPf8XJWKB2P'], function(message) {
  console.log(message.message)
})
```

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

### Troubleshooting

Not seeing any messages? Make sure you started IPFS:
```console
ipfs daemon
```

Still having trouble? Turn on verbose logging and restart Node.js
```console
export DEBUG="nomad*"
node subscribe.js
```

### Full API

#### Subscribing
#### Publishing
#### Node identity

## Caveats
Nomad is alpha software and depends on IPFS which is also alpha software. Things may break at any time. Nomad does not currently include features that support node fault tolerance, but they're in the works!

## Contribute

Feel free to dive in! [Open an issue](https://github.com/RichardLitt/standard-readme/issues/new) or submit PRs.

Standard Readme follows the [Contributor Covenant](http://contributor-covenant.org/version/1/3/0/) Code of Conduct.

## License

MIT (c) IDEO CoLab