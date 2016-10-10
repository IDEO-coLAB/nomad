### !! Nomad is currently in heavy development !!

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
