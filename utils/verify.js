const { run } = require('hardhat')

async function verify(address, args) {
    console.log('Verifying contracts...')
    try {
        await run('verify:verify', {
            address: address,
            constructorArguments: args,
        })
    } catch (e) {
        if (e.message.toLowerCase().includes('already verified')) {
            console.log('Already verified!')
        } else {
            console.log(e)
        }
    }
}

module.exports = { verify }
