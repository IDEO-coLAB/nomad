// Note about Nomad Message Structure in IPFS
//
// Nomad stores messages as a linked list of IPLD objects. Each
// object has an empty data property and two links:
//
// {
//   data: '',
//   links: [
//     { source: prev ... }
//     { source: data ... }
//   ]
// }
//
// data: references an IPLD object that is the head of a unixfs object that is the message data
// prev: references the previous Nomad message object