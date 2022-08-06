const networkConfig = {
    31337: {
        name: 'hardhat',
    },
    4: {
        name: 'rinkeby',
    },
    5: {
        name: 'goerli'
    }
}

const developmentChains = ['hardhat', 'localhost']

module.exports = {
    networkConfig,
    developmentChains,
}
