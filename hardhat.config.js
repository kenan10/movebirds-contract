require('dotenv').config()
require('@nomiclabs/hardhat-etherscan')
require('@nomicfoundation/hardhat-chai-matchers')
require('hardhat-gas-reporter')
require('solidity-coverage')
require('hardhat-deploy')

const PRIVATE_KEY = process.env.PRIVATE_KEY
const ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY
const COINMARKETCAP_API_KEY = process.env.COINMARKETCAP_API_KEY
const MAINNET_RPC_URL = process.env.MAINNET_RPC_URL
const MAINNET_PRIVATE_KEY = process.env.MAINNET_PRIVATE_KEY
const GOERLI_RPC_URL = process.env.GOERLI_RPC_URL

module.exports = {
    solidity: {
        version: '0.8.9',
        settings: {
            optimizer: {
                enabled: true,
                runs: 200
            }
        }
    },
    defaultNetwork: 'hardhat',
    networks: {
        hardhat: {
            chainId: 31337,
            gasPrice: 33000000000
        },
        mainnet: {
            chainId: 1,
            url: MAINNET_RPC_URL,
            accounts: [MAINNET_PRIVATE_KEY]
        },
        goerli: {
            chainId: 5,
            url: GOERLI_RPC_URL,
            accounts: [PRIVATE_KEY]
        }
    },
    etherscan: {
        apiKey: ETHERSCAN_API_KEY
    },
    gasReporter: {
        enabled: true,
        currency: 'USD',
        outputFile: 'gas-reporter.txt',
        noColors: true,
        coinmarketcap: COINMARKETCAP_API_KEY
    },
    namedAccounts: {
        deployer: {
            default: 0
        }
    },
    settings: {
        optimizer: {
            enabled: true,
            runs: 1000
        }
    }
}
