const { network, ethers, getNamedAccounts } = require('hardhat')
const fs = require('fs')

const FRONTEND_ADDRESSES_FILE = '../frontend/constants/contractAddresses.json'
const FRONTEND_ABI_FILE = '../frontend/constants/abi.json'

module.exports = async function () {
    if (process.env.UPDATE_FRONT_END) {
        // console.log('Updating frontend...')
        updateContractAddresses()
        updateAbi()
        // console.log('Updated.')
    }
}

async function updateContractAddresses() {
    const deployer = (await getNamedAccounts()).deployer
    const hootis = await ethers.getContract('Hootis', deployer)
    const chainId = network.config.chainId
    const currentAddresses = JSON.parse(
        fs.readFileSync(FRONTEND_ADDRESSES_FILE, 'utf-8')
    )
    if (chainId in currentAddresses) {
        if (!currentAddresses[chainId].includes(hootis.address)) {
            currentAddresses[chainId].push(hootis.address)
        }
    } else {
        currentAddresses[chainId] = [hootis.address]
    }
    fs.writeFileSync(FRONTEND_ADDRESSES_FILE, JSON.stringify(currentAddresses))
}

async function updateAbi() {
    const deployer = (await getNamedAccounts()).deployer
    const hootis = await ethers.getContract('Hootis', deployer)
    fs.writeFileSync(
        FRONTEND_ABI_FILE,
        hootis.interface.format(ethers.utils.FormatTypes.json)
    )
}

module.exports.tags = ['all']
