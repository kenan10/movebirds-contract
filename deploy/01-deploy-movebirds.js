const { developmentChains, networkConfig } = require('../helper-hardhat.config')
const { verify } = require('../utils/verify')
const { network } = require('hardhat')
require('dotenv').config()

module.exports = async ({ getNamedAccounts, deployments }) => {
    const { deploy, log } = deployments
    const { deployer } = await getNamedAccounts()
    const DEFAULT_BASE_URI = process.env.DEFAULT_BASE_URI

    const args = [DEFAULT_BASE_URI]

    const hootis = await deploy('Hootis', {
        from: deployer,
        args: args,
        log: true,
        waitConfirmations:
            networkConfig[network.config.chainId].blockConfirmation || 1
    })

    if (!developmentChains.includes(network.name)) {
        await verify(hootis.address, args)
    }

    log('----------------------------------------------------')
}

module.exports.tags = ['all']
