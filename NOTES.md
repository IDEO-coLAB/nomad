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







Nomad raw pubsub object: this object is sent via floodsub to notify nodes of new messages:
{ 
  from: (String) peer id of publisher>
  data: (Buffer) JSON that represents a message header object
  seqno: (Buffer) seqence number, not currently used.
  topicCIDs: (Array) array of topics, not used
}

Nomad message header object:
{
  header_id: (String) hash of the header IPLD object in ipfs
  header_idx: (integer) index of the message
  prev: hash of the previous header IPLD object or null
  data: hash of the message data IPLD object
}