# Nomad 

> A decentralized platform for open data streams built on IPFS

## Overview 
Nomad is a decentralized system for subscribing to, processing, and publishing data in the form of ordered message streams. Nomad is decentralized: there are no message brokers through which messages pass. Nomad uses [IPFS](http://ipfs.io) to create a peer-to-peer network of nodes that routes messages from publisher to subscriber. Streams are published by nodes which are identified by a public key hash, making Nomad a permissionless system. Anyone can create a new node, subscribe to existing streams, and publish a stream without signing up for any proprietary service.

## Get Started  

### Install
Head to the IPFS distributions page [here](https://dist.ipfs.io/#go-ipfs) and download the binary for your platform. 

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

> If you don't have [Node.js](https://nodejs.org/en/download/), install it first.

Install the Nomad npm module:
```console
npm install --save nomad-stream
```

### Write code to subscribe to a stream
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

## Contribute

Feel free to dive in! [Open an issue](https://github.com/RichardLitt/standard-readme/issues/new) or submit PRs.

Standard Readme follows the [Contributor Covenant](http://contributor-covenant.org/version/1/3/0/) Code of Conduct.

## License

MIT (c) IDEO CoLab











This library is in flux and not quite ready for active 3rd party usage. When ready, this doc will be updated to with API usage info as soon as possible. 

---------

<br />

# Nomad
A dispersed computing network composed of living 'Software Sensors'


## What is a 'Software Sensor'?

A 'software sensor' is a node in the Nomad network that takes zero or more input streams and shares messages in a single output stream. Software sensors have a unique identity and produce signed messages that can be verifiably traced back to the emitting sensor. There are two types of software sensors: `Atomic` and `Composite`.


## Atomic Sensors

**Atomic Sensors** broadcast messages that contain a single, arbitrary data structure (as defined by the Nomad network protocol). The data contained in `Atomic` sensor messages has pointers to previous broadcasts, and are used in arbitrary compositions by network participants and consumers. Atomic Sensors may be a mix of hardware and software, or software only. We envision software sensors often running on embedded hardware and publishing messages based on sensor readings.

### Atomic Examples

- **Hardware + Software**: A single sensor that consists of a physical water temperature sensor that is able to automatically broadcast a message with the current water temperature, to the network, every minute.

- **Software**: A research team that, based on their latest findings, updates a value representing the volume of E. coli required to synthesize biofuel in a given aqueous environment. Whenever the value changes, a message containing the new value is automatically broadcast to the network.


## Composite Sensors

**Composite Sensors** broadcast messages that contain a single, arbitrary data structure whose end value(s) are composed from messages from various, upstream `Atomic` and `Composite` sensors in the network. In this sense, `Composite` sensors can be seen as generating higher-order data and messages. These higher-order messages can be consumed by other network participants. Composite sensors also contain knowledge of the streams they tap to create their published messages. This allows subscribers to access the tree of intermediate messages that led to the publication of a given message all the way down to the originating `Atomic` sensors.

### Composite Examples

- **Hardware + Software**: A single sensor that reads data directly from several physical water temperature sensors, and also subscribes to several water temperature `Atomic` sensors in the network. It then composes the various temperatures into a single average value and automatically broadcasts it to the network in its single, composited message.

- **Software**: A single sensor that only subscribes to several water temperature `Atomic` sensors in the network and composes the various temperatures into a single average value and automatically broadcasts to the network it in a message. 

<br /><br />
_More docs on the way soon..._
