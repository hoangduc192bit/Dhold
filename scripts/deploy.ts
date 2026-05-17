import { ethers } from "hardhat";
async function main() {
  const [d] = await ethers.getSigners();
  console.log("Deploying from:", d.address);
  const C = await ethers.getContractFactory("ArcBounty");
  const c = await C.deploy();
  await c.waitForDeployment();
  const addr = await c.getAddress();
  console.log("\n✅ ArcBounty deployed:", addr);
  console.log("🔍 Arcscan:", "https://testnet.arcscan.app/address/" + addr);
  console.log("\n👉 Set NEXT_PUBLIC_CONTRACT_ADDRESS=" + addr);
}
main().catch(e => { console.error(e); process.exit(1); });
