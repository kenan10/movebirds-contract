const { describe, beforeEach, it } = require('mocha')
const { assert, expect } = require('chai')
const { developmentChains } = require('../helper-hardhat.config')
const { network, deployments, ethers, getNamedAccounts } = require('hardhat')
require('dotenv').config()

!developmentChains.includes(network.name)
    ? describe.skip
    : describe('Movebirds', () => {
          let movebirds
          let deployer
          let minter
          let whitelistAccounts

          beforeEach(async () => {
              const signers = await ethers.getSigners()
              deployer = (await getNamedAccounts()).deployer
              minter = signers[0]
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
              movebirds = await ethers.getContract('Movebirds', deployer)
              movebirds.connect()
          })

          describe('public mint', () => {
              it('max supply', async () => {
                  await movebirds.setSaleStage(3)
                  const max_supply = await movebirds.maxSupply()
                  const mintNumber = 1
                  const signers = await ethers.getSigners()

                  signers.forEach(async (signer) => {
                      const connected = await movebirds.connect(signer)
                      const totalSupply = parseInt(
                          await movebirds.totalSupply()
                      )

                      if (totalSupply + mintNumber > max_supply) {
                          await expect(
                              connected.mintPublic(mintNumber)
                          ).to.be.revertedWithCustomError(
                              movebirds,
                              'Movebirds__SoldOut'
                          )
                      } else {
                          await connected.mintPublic(mintNumber)
                      }
                  })
              })

              it('max per wallet', async () => {
                  await movebirds.setSaleStage(3)
                  const maxPerWallet = await movebirds.maxPerAddress()

                  await expect(
                      movebirds.mintPublic(parseInt(maxPerWallet) + 1)
                  ).to.be.revertedWithCustomError(
                      movebirds,
                      'Movebirds__OutOfMaxPerWallet'
                  )
              })

              it('can`t mint in incorrect stage', async () => {
                  await expect(
                      movebirds.mintPublic(1)
                  ).to.be.revertedWithCustomError(
                      movebirds,
                      'Movebirds__StageNotStartedYet'
                  )
              })
          })

          describe('mintAllowlist', () => {
              let signatures = []
              let hashes = []
              const signerSK = process.env.PRIVATE_KEY
              const signerPK = process.env.DEPLOYER_ADDRESS

              beforeEach(async () => {
                  await movebirds.setAllowlistSigner(signerPK)
                  whitelistAccounts.forEach(async (account) => {
                      const addressHash = ethers.utils.id(account.address)
                      if (!hashes.includes(addressHash)) {
                          hashes.push(addressHash)
                      }
                      const addressBytes = ethers.utils.arrayify(addressHash)

                      const signer = new ethers.Wallet(signerSK)
                      const signature = await signer.signMessage(addressBytes)
                      if (!signatures.includes(signature)) {
                          signatures.push(signature)
                      }
                  })
              })

              it('max supply', async () => {
                  await movebirds.setSaleStage(1)
                  const max_supply = await movebirds.maxSupply()
                  const mintNumber = 1
                  for (let i = 0; i < whitelistAccounts.length; i++) {
                      const allowlister = whitelistAccounts[i]
                      const connected = await movebirds.connect(allowlister)
                      const hash = hashes[i]
                      const signature = signatures[i]
                      const totalSupply = parseInt(
                          await movebirds.totalSupply()
                      )

                      if (totalSupply + mintNumber > max_supply) {
                          await expect(
                              connected.mintAllowlist(
                                  mintNumber,
                                  hash,
                                  signature
                              )
                          ).to.be.revertedWithCustomError(
                              movebirds,
                              'Movebirds__SoldOut'
                          )
                      } else {
                          await connected.mintAllowlist(
                              mintNumber,
                              hash,
                              signature
                          )
                      }
                  }
              })

              it('max per wallet', async () => {
                  await movebirds.setSaleStage(1)
                  const maxPerWallet = await movebirds.maxPerAddress()
                  const allowlister = whitelistAccounts[0]
                  const connected = await movebirds.connect(allowlister)
                  const hash = hashes[0]
                  const signature = signatures[0]

                  await expect(
                      connected.mintAllowlist(
                          parseInt(maxPerWallet) + 1,
                          hash,
                          signature
                      )
                  ).to.be.revertedWithCustomError(
                      movebirds,
                      'Movebirds__OutOfMaxPerWallet'
                  )
              })

              it('valid signer', async () => {
                  await movebirds.setSaleStage(1)
                  const connected = await movebirds.connect(minter)
                  const addressHashCorrect = ethers.utils.id(minter.address)
                  const addressBytesCorrect =
                      ethers.utils.arrayify(addressHashCorrect)

                  const signerCorrect = new ethers.Wallet(signerSK)
                  const signatureCorrect = await signerCorrect.signMessage(
                      addressBytesCorrect
                  )

                  expect(
                      await connected.mintAllowlist(
                          1,
                          addressHashCorrect,
                          signatureCorrect
                      )
                  ).to.be.ok
              })

              it('invalid signer', async () => {
                  await movebirds.setSaleStage(1)
                  const addressHashCorrect = ethers.utils.id(minter.address)
                  const addressBytesCorrect =
                      ethers.utils.arrayify(addressHashCorrect)

                  const signerCorrect = new ethers.Wallet(signerSK)
                  const signatureCorrect = await signerCorrect.signMessage(
                      addressBytesCorrect
                  )

                  expect(
                      await movebirds.mintAllowlist(
                          1,
                          addressHashCorrect,
                          signatureCorrect
                      )
                  ).to.be.revertedWithCustomError(
                      movebirds,
                      'Movebirds__InvalidSigner'
                  )
              })
          })

          describe('set sale stage', () => {
              it('public mint', async () => {
                  await movebirds.setSaleStage(3)
                  assert.equal(await movebirds.s_saleStage(), 3)
              })

              it('allowlist mint', async () => {
                  await movebirds.setSaleStage(1)
                  assert.equal(await movebirds.s_saleStage(), 1)
              })
          })
      })
