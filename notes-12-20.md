- need tight cache abstraction since implementation will differ whether we're running on Node (filesystem cache) or browser (browser local storage cache)

- currently we use cache to keep track of which subscription messages we've already pushed to user via cb

- what other places will we need abstraction, for example nomad keys / identity and ipfs repo?

- near term, nomad only directly supporst saving identity to filesystm in node.js, but you can use the api to set identity however you get it in node.js or browser.

- node api conforms to doc
- design and implement cache abstraction are clean and swappable
- node.js filesystem implementation of cache
