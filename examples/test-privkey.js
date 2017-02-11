const Nomad = require('../src')

const node = new Nomad()
const privKey = 'CAASqAkwggSkAgEAAoIBAQC0cilNmJ93lLcVR+HDHlOCAz45YvG9/iLaFpJOXCMV04bRuI3wrLohb1M5XVbOC1OX3fF1fYrYW9QAlpnPLOqJFDFV3QOnuhUiAl2tXKbGJPjr+WNZ0EBqHII5DxYPaCxwECusZnE4TDZvhCZBiYDIVWswmko/JfHRoHR1k0AAaNtgMjVdJdZjSkvDb22ZcuQnlmRYRFvnKH9E5S5NLk1wvOwRigh6jXjJLTrA/jUk0bJKmS2pkuq+dN1IOcdZmAXhlR4J0cuwJ1FbsxZNCuYuxSd3uLVqn4dKKXAjYanaxOb9WwGMOnoU5e/CUjhcC1ACOdp22JOR+we2n01PaUCzAgMBAAECggEBALGhzF0RyLHMGSr+1xTgDq7nCGMvrvAsdByiqaYv923uDEL53ei18IkncRMAeopdBg5zMtZJHtx8EUf++SzEd6E32pU++/EqMtGG6LbXhWl7TfvmRdJNOov6woru+fVyxIQQtx2AvyX/iHrg6VQMy1TrGZj/2eUuMk39GYgAy7lZ152latP2KrA56VHx3h4A4fBXglajLGAa4oF37uhbFBGicScowpCgTp0R7tkUfKIYdzw6a+7v3n/w4F6HfP7RfKapEAd+uCq1aIOqHkGhjFL4OUW8hsEnnQQbOwlYPdGKaHfqG9AkgMQI6/CTMU/iXU2IksvU+8kYl5vor3FM1QkCgYEA5p1Tyw+X92zfoHz3R6t0cgP6+ufKCDp9Ma72IYbyPVNwxR+jIxLMKPWb8aoJmQXmzYNbYj5TybTLcyywD7DCYjaKhsO4SUJ6bnF9XOrh7Wzh7aULPQ7QnyNClGu57YBCDKIVob8Qb1AEHcakMr22qbrLCQolQZWZzBitpYrhitcCgYEAyE8XogdtL/YRrtPHi4ZP7zIk8UUPqDuiOcWOi4JmiRUJsyBiXh7QiEpingvFrDV/247F7TCTVGrEUhtpWxE+krQ8jNXpUpVt3FPdeX+eqS3906xQq8Ifmc+8+owJfxZh6PYysI36uifVyQJkqimABRCRHudNg1UburZVoyw3+YUCgYEAiOWr8Eb5dy9yMNr+D9V/8o7aVkdybyAJYYzzH0P0WONHdj0popBuEYJ7aCIAQI54TFdF0DQfmQVyIJTOjwHm4lZuNUHKC/Miqp1ERfxI0aBpHaFz4nMA9PcBdwnb/Vi93LH7FWFOaEWfq+1XW6ey3167WEplg2FDQx0DN9oRuVECgYBnEZt9egjK1vj+Vmak+nWDBPBRXVHTJOwygd75Fh4ghzy4eP9kosJ2fqAD5tbN57FkjjB1/bqxg0aFYSly/IqP/kHxzdgC8HTZHCYn8Gz5bHrhQhc4aejMwkHhQdFZHXE/5/7pLgVHaFvu1FZr4HLJKF8j4azW2SItjsi973DV6QKBgD5vF/vZKJiaMWFjz580Mp8JoWgH+fasAiCBxw9cO4+x/t5JqWH2D4zbzc9gHPbMrsXawyqpP8Gk9ieeYSLqF01WNf5exC3ylUK+czRrWcoXlZPWkFCasR2P7VGhffAqea5LRBfBf0ux2A5f9z4NiAO1QClkZdDk04n2OqwCcW0r'

const peer = 'QmX4Wi69rQzddvjmVrVv6rEKRbPwFjefv4uwUJeuv4BMTZ'

node.start()
  .then(() => {
    console.log('PRIV_KEY TEST STARTED')
    // HOW do we handle failed subscribes - nodes that are offline - ids that cannot be dialed are rejected promises?
    node.subscribe([ peer ], (msg) => {
      console.log('============ DELIVERING ===========>', msg)
    })

    // return new Promise((resolve, reject) => {
    //   setTimeout(() => {
    //     console.log('STOPPING...')
    //     node.unsubscribe(peer)
    //     node.stop()
    //   }, 40000)
    // })
  })
