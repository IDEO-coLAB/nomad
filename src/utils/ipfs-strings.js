
exports = module.exports

// helper function to construct multiaddress strings
exports.webRTCMultiAddr = (ip, port, peerId) => {
  return `/libp2p-webrtc-star/ip4/${ip}/tcp/${port}/ws/ipfs/${peerId}`
}
