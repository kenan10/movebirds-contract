const networkConfig = {
    31337: {
        name: 'hardhat',
    },
    4: {
        name: 'rinkeby',
        blockConfirmation: 6
    },
    5: {
        name: 'goerli',
        blockConfirmation: 6
    }
}

const developmentChains = ['hardhat', 'localhost']

module.exports = {
    networkConfig,
    developmentChains
}
