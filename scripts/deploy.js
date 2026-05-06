const { ethers } = require('hardhat');

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log('Deploying ZeroPayBatch with account:', deployer.address);

  const balance = await ethers.provider.getBalance(deployer.address);
  console.log('Account balance:', ethers.utils.formatEther(balance), '0G');

  const Factory = await ethers.getContractFactory('ZeroPayBatch');
  const contract = await Factory.deploy();
  await contract.deployed();

  const address = contract.address;
  console.log('\n✅ ZeroPayBatch deployed to:', address);
  console.log('\nAdd this to your .env.local:');
  console.log(`NEXT_PUBLIC_BATCH_CONTRACT=${address}`);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
