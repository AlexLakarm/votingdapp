// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// You can also run a script with `npx hardhat run <script>`. If you do that, Hardhat
// will compile your contracts, add the Hardhat Runtime Environment's members to the
// global scope, and execute the script.
const hre = require("hardhat");

async function main() {
  console.log("Deploying Voting contract...");

  // Get the contract factory
  const Voting = await hre.ethers.getContractFactory("Voting");
  
  // Deploy the contract
  const voting = await Voting.deploy();
  await voting.waitForDeployment();

  // Get the deployed contract address
  const address = await voting.getAddress();
  
  console.log("Voting contract deployed to:", address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });