

// i want to initialize a new node


// i want to specify compose streams from a, b


// i want to know when a new value from a comes in
// i want to know when a new value from b comes in
// i want to be able to work with stream a or stream b, or all streams on updates
// i want to be able to work with the latest values on updates
// i want to be able to get the last cached values from all streams I'm working with


// i want to be able to easily publish new messages from this node based on the key
// i want to be able to get the last N values I published
// i want to be able to sign messages (enforce signing before publishing?)


// i want to know when i'm online
// i want to know when i'm offline
// i want to control when i'm online
// i want to control when i'm offline


// i want to tell it to use ipfs (or some other network)




//
//
// likely outside libs
// i want to be able to corecurse back to the root?













nomad.connect(/* config? */)
nomad.init(/* config? */)
// what does the config contain
// is it a json file

nomad.sub('a')
nomad.sub('b')
nomad.sub('c')
// or sub just pulls the init'd nodes from some config file
// I like the config idea better
// this should be based on the config - intrinsic
// you should be able to blacklist at some point?










// API that someone codes to

// ask for specific values
nomad.read('a', (val) => {})
nomad.read('b', (val) => {})

// listen to certain ones and not others?
// what's the difference from the above?
nomad.read(['a', 'c'], (theseVals /*???*/, triggerID) => {})

// if none given, we return all vals on some reply

// what if we receive one val from the 3
// a has new message
// we get all 3, but do we know who triggered the update?
nomad.read((allVals, triggerID) => {})



nomad.publish({ a: 1 })








//
//
//
// Example dev usage
//
//
//

import nomad from 'nomad'
// does the config file get pulled in automatically?
// look for a config file
// automatically generate a config file in the npm package?
// perhaps later...


nomad.connect()
.then((id) => {
  // true / false?
  // return the online network peer identity?
})
.error((err) => {
  // some relevant connection error
})


/*

vals is a map
{
  hashB: 'some val',
  hashC: { a: 123 },
  hashD: 123
}

*/
nomad.read((vals, triggerID) => {

})




























