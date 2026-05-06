const { ethers } = require('hardhat');

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log('Deploying ArciumRegistry from:', deployer.address);
  console.log('Balance:', ethers.utils.formatEther(await deployer.getBalance()), '0G');

  const Registry = await ethers.getContractFactory('ArciumRegistry');
  const registry = await Registry.deploy();
  await registry.deployed();

  console.log('ArciumRegistry deployed to:', registry.address);
  console.log('Add to .env.local:');
  console.log(`NEXT_PUBLIC_ARCIUM_REGISTRY=${registry.address}`);
}

main().catch(err => { console.error(err); process.exit(1); });
