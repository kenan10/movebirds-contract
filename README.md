# How to deploy to mainnet? 
1. Crete wallet in Metamask
2. Send ETH on created wallet
3. Put sample .env file into project root folder
4. Put private key to .env file into variable MAINNET_PRIVATE_KEY
5. Create new Alchemy mainnet app
6. Put rpc url from to .env file into variable MAINNET_RPC_URL
7. Put base URI for metadata into DEFAULT_BASE_URI variable
8. Run `sudo apt install nodejs`
9. Run `sudo apt install npm`
10. Run `npm install --global yarn`
11. Go to project root folder and run `yarn install`, run `yarn hardhat test` to ensure that everything OK
12. Run `yarn hardhat deploy --mainnet`
13. Note address where contract was deployed
14. Go to OS and register collection https://opensea.io/get-listed
15. Set collection appereance and royalty on OS collection settings