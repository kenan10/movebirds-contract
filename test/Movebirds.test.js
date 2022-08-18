const { describe, beforeEach, it } = require('mocha')
const { assert, expect } = require('chai')
const { developmentChains } = require('../helper-hardhat.config')
const { network, deployments, ethers, getNamedAccounts } = require('hardhat')
require('dotenv').config()

!developmentChains.includes(network.name)
    ? describe.skip
    : describe('Hootis', () => {
          let hootis
          let deployer
          let minter
          let whitelistAccounts

          beforeEach(async () => {
              const signers = await ethers.getSigners()
              deployer = (await getNamedAccounts()).deployer
              minter = signers[12]
              whitelistAccounts = [
                  signers[1],
                  signers[2],
                  signers[3],
                  signers[4],
                  signers[5],
                  signers[6],
                  signers[7],
                  signers[8],
                  signers[9],
                  signers[10],
                  signers[11]
              ]

              await deployments.fixture(['all'])
              hootis = await ethers.getContract('Hootis', deployer)
              hootis.connect(deployer)
          })

          describe('public mint', () => {
              it('max supply', async () => {
                  await hootis.setSaleStage(3)
                  const max_supply = await hootis.maxSupply()
                  const mintNumber = 1
                  const signers = await ethers.getSigners()

                  signers.forEach(async (signer) => {
                      const connected = await hootis.connect(signer)
                      const totalSupply = parseInt(await hootis.totalSupply())

                      if (totalSupply + mintNumber > max_supply) {
                          await expect(
                              connected.mintPublic(mintNumber)
                          ).to.be.revertedWithCustomError(
                              hootis,
                              'Hootis__SoldOut'
                          )
                      } else {
                          await connected.mintPublic(mintNumber)
                      }
                  })
              })

              it('incrorect amount eth sent', async () => {
                  await hootis.setSaleStage(3)
                  const price = await hootis.tokenPrice()
                  const toMintMany = await hootis.maxPerAddress()
                  const value = price * toMintMany

                  expect(
                      await hootis.mintPublic(1, { value: value.toString() })
                  ).to.be.ok
                  await expect(
                      hootis.mintPublic(1)
                  ).to.be.revertedWithCustomError(
                      hootis,
                      'Hootis__IncorrectValue'
                  )
              })

              it('max per wallet', async () => {
                  await hootis.setSaleStage(3)
                  const maxPerWallet = await hootis.maxPerAddress()

                  await expect(
                      hootis.mintPublic(parseInt(maxPerWallet) + 1)
                  ).to.be.revertedWithCustomError(
                      hootis,
                      'Hootis__OutOfMaxPerWallet'
                  )
              })

              it('can`t mint in incorrect stage', async () => {
                  await expect(
                      hootis.mintPublic(1)
                  ).to.be.revertedWithCustomError(
                      hootis,
                      'Hootis__StageNotStartedYet'
                  )
              })
          })

          describe('mintAllowlist', () => {
              let signatures = []
              const signerSK = process.env.PRIVATE_KEY
              const signerPK = process.env.DEPLOYER_ADDRESS

              beforeEach(async () => {
                  await hootis.setAllowlistSigner(signerPK)
                  whitelistAccounts.forEach(async (account) => {
                      const addressHash = ethers.utils.solidityKeccak256(
                          ['address'],
                          [account.address]
                      )
                      const addressBytes = ethers.utils.arrayify(addressHash)

                      const signer = new ethers.Wallet(signerSK)
                      const signature = await signer.signMessage(addressBytes)
                      if (!signatures.includes(signature)) {
                          signatures.push(signature)
                      }
                  })
              })

              it('max supply', async () => {
                  await hootis.setSaleStage(1)
                  const max_supply = await hootis.maxSupply()
                  const mintNumber = 1
                  for (let i = 0; i < whitelistAccounts.length; i++) {
                      const allowlister = whitelistAccounts[i]
                      const connected = await hootis.connect(allowlister)
                      const signature = signatures[i]
                      const totalSupply = parseInt(await hootis.totalSupply())

                      if (totalSupply + mintNumber > max_supply) {
                          await expect(
                              connected.mintAllowlist(mintNumber, signature)
                          ).to.be.revertedWithCustomError(
                              hootis,
                              'Hootis__SoldOut'
                          )
                      } else {
                          await connected.mintAllowlist(mintNumber, signature)
                      }
                  }
              })

              it('max per wallet', async () => {
                  await hootis.setSaleStage(1)
                  const maxPerWallet = await hootis.maxPerAddress()
                  const allowlister = whitelistAccounts[0]
                  const connected = await hootis.connect(allowlister)
                  const signature = signatures[0]

                  await expect(
                      connected.mintAllowlist(
                          parseInt(maxPerWallet) + 1,
                          signature
                      )
                  ).to.be.revertedWithCustomError(
                      hootis,
                      'Hootis__OutOfMaxPerWallet'
                  )
              })

              it('valid signer', async () => {
                  await hootis.setSaleStage(1)
                  const connected = await hootis.connect(minter)
                  const addressHashCorrect = ethers.utils.solidityKeccak256(
                      ['address'],
                      [minter.address]
                  )
                  const addressBytesCorrect =
                      ethers.utils.arrayify(addressHashCorrect)

                  const signerCorrect = new ethers.Wallet(signerSK)
                  const signatureCorrect = await signerCorrect.signMessage(
                      addressBytesCorrect
                  )

                  expect(await connected.mintAllowlist(1, signatureCorrect)).to
                      .be.ok
              })

              it('invalid signer', async () => {
                  await hootis.setSaleStage(1)
                  const addressHashCorrect = ethers.utils.solidityKeccak256(
                      ['address'],
                      [minter.address]
                  )
                  const addressBytesCorrect =
                      ethers.utils.arrayify(addressHashCorrect)

                  const signerCorrect = new ethers.Wallet(signerSK)
                  const signatureCorrect = await signerCorrect.signMessage(
                      addressBytesCorrect
                  )

                  await expect(
                      hootis.mintAllowlist(1, signatureCorrect)
                  ).to.be.revertedWithCustomError(
                      hootis,
                      'Hootis__InvalidSigner'
                  )
              })

              it('incrorect amount eth sent', async () => {
                  await hootis.setSaleStage(1)
                  const price = await hootis.tokenPrice()
                  const toMintMany = await hootis.maxPerAddress()
                  const value = price * toMintMany

                  const allowlister = whitelistAccounts[0]
                  const connected = await hootis.connect(allowlister)
                  const signature = signatures[0]

                  expect(
                      await connected.mintAllowlist(toMintMany, signature, {
                          value: value.toString()
                      })
                  ).to.be.ok

                  await expect(
                      hootis.mintAllowlist(toMintMany, signature)
                  ).to.be.revertedWithCustomError(
                      hootis,
                      'Hootis__IncorrectValue'
                  )
              })
          })

          describe('set sale stage', () => {
              it('public mint', async () => {
                  await hootis.setSaleStage(3)
                  assert.equal(await hootis.saleStage(), 3)
              })

              it('allowlist mint', async () => {
                  await hootis.setSaleStage(1)
                  assert.equal(await hootis.saleStage(), 1)
              })
          })

          describe('set price', () => {
              it('correct', async () => {
                  const newPrice = ethers.utils.parseEther('0.002')
                  await hootis.setPrice(newPrice)
                  assert.equal(
                      (await hootis.tokenPrice()).toString(),
                      newPrice.toString()
                  )
              })
          })
      })
