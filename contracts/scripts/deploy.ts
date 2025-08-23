import { ethers } from "hardhat";

async function main() {
  console.log("🚀 Deploying Defeat the Dragon contracts to Base...");

  // Get the deployer account
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);
  console.log("Account balance:", (await deployer.getBalance()).toString());

  // Deploy FocusToken first
  console.log("\n📦 Deploying FocusToken...");
  const FocusToken = await ethers.getContractFactory("FocusToken");
  const focusToken = await FocusToken.deploy();
  await focusToken.deployed();
  console.log("FocusToken deployed to:", focusToken.address);

  // Deploy AchievementNFT
  console.log("\n🏆 Deploying AchievementNFT...");
  const AchievementNFT = await ethers.getContractFactory("AchievementNFT");
  const achievementNFT = await AchievementNFT.deploy();
  await achievementNFT.deployed();
  console.log("AchievementNFT deployed to:", achievementNFT.address);

  // Deploy GameContract
  console.log("\n🎮 Deploying GameContract...");
  const GameContract = await ethers.getContractFactory("GameContract");
  const gameContract = await GameContract.deploy(focusToken.address, achievementNFT.address);
  await gameContract.deployed();
  console.log("GameContract deployed to:", gameContract.address);

  // Set up contract permissions
  console.log("\n🔗 Setting up contract permissions...");
  
  // Set game contract in FocusToken
  const focusTokenTx = await focusToken.setGameContract(gameContract.address);
  await focusTokenTx.wait();
  console.log("✅ FocusToken game contract set");

  // Set game contract in AchievementNFT
  const achievementNFTTx = await achievementNFT.setGameContract(gameContract.address);
  await achievementNFTTx.wait();
  console.log("✅ AchievementNFT game contract set");

  // Verify deployments
  console.log("\n🔍 Verifying deployments...");
  console.log("FocusToken address:", focusToken.address);
  console.log("AchievementNFT address:", achievementNFT.address);
  console.log("GameContract address:", gameContract.address);

  // Save deployment addresses
  const deploymentInfo = {
    network: await ethers.provider.getNetwork(),
    deployer: deployer.address,
    contracts: {
      focusToken: focusToken.address,
      achievementNFT: achievementNFT.address,
      gameContract: gameContract.address,
    },
    timestamp: new Date().toISOString(),
  };

  console.log("\n📋 Deployment Summary:");
  console.log(JSON.stringify(deploymentInfo, null, 2));

  // Save to file for frontend use
  const fs = require("fs");
  const path = require("path");
  
  const deploymentPath = path.join(__dirname, "../deployments");
  if (!fs.existsSync(deploymentPath)) {
    fs.mkdirSync(deploymentPath, { recursive: true });
  }

  const networkName = (await ethers.provider.getNetwork()).name;
  const deploymentFile = path.join(deploymentPath, `${networkName}.json`);
  
  fs.writeFileSync(deploymentFile, JSON.stringify(deploymentInfo, null, 2));
  console.log(`\n💾 Deployment info saved to: ${deploymentFile}`);

  console.log("\n🎉 Deployment completed successfully!");
  console.log("\nNext steps:");
  console.log("1. Update frontend with contract addresses");
  console.log("2. Test contract interactions");
  console.log("3. Verify contracts on BaseScan");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });
