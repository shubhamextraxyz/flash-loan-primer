const { expect } = require('chai');
const { ethers } = require('hardhat');

const tokens = (n) => {
  return ethers.parseUnits(n.toString(), 'ether')
}

describe('Flashloan', () => {
  let token, flashLoan, flashLoanReceiver
  let deployer, user1

  beforeEach(async () => {
    // Setup accounts
    accounts = await ethers.getSigners()
    deployer = accounts[0]

    // Load contracts
    const FlashLoan = await ethers.getContractFactory('FlashLoan')
    const FlashLoanReceiver = await ethers.getContractFactory('FlashLoanReceiver')
    const Token = await ethers.getContractFactory('Token')

    // Deploy token
    token = await Token.deploy('Dapp University', 'DAPP', '1000000')

    // Deploy Flash Loan Pool
    flashLoan = await FlashLoan.deploy(await token.getAddress())

    // Approve tokens before depositing
    let transaction = await token.connect(deployer).approve(await flashLoan.getAddress(), tokens(1000000))
    await transaction.wait()

    // Deposit tokens into the pool
    transaction = await flashLoan.connect(deployer).depositTokens(tokens(1000000))
    await transaction.wait()

    // Deploy Flash Loan Receiver
    flashLoanReceiver = await FlashLoanReceiver.deploy(await flashLoan.getAddress())
  })

  describe('Deployment', () => {

    it('sends tokens to the Crowdsale contract', async () => {
      expect(await token.balanceOf(await flashLoan.getAddress())).to.equal(tokens(1000000))
    })

  })

  describe('Borrowing funds', () => {

    it('borrows funds from the pool', async () => {
      let amount = tokens(100)
      let transaction = await flashLoanReceiver.connect(deployer).executeFlashLoan(amount)
      let result = await transaction.wait()

      await expect(transaction).to.emit(flashLoanReceiver, 'LoanReceived')
        .withArgs(await token.getAddress(), amount)
    })

  })

})