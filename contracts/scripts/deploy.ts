import { ethers } from "hardhat";
import * as fs from "fs";
import * as path from "path";

async function main() {
    console.log("🚀 Deploying Autonomous Procurement Agent contracts...\n");

    // Get deployer account
    const [deployer] = await ethers.getSigners();
    console.log("Deploying with account:", deployer.address);
    console.log("Account balance:", ethers.formatEther(await ethers.provider.getBalance(deployer.address)), "ETH\n");

    // Deploy MockX402
    console.log("📦 Deploying MockX402...");
    const MockX402 = await ethers.getContractFactory("MockX402");
    const x402 = await MockX402.deploy();
    await x402.waitForDeployment();
    const x402Address = await x402.getAddress();
    console.log("✅ MockX402 deployed to:", x402Address);

    // Deploy MockAP2
    console.log("📦 Deploying MockAP2...");
    const MockAP2 = await ethers.getContractFactory("MockAP2");
    const ap2 = await MockAP2.deploy();
    await ap2.waitForDeployment();
    const ap2Address = await ap2.getAddress();
    console.log("✅ MockAP2 deployed to:", ap2Address);

    // Deploy EncryptionHelper
    console.log("📦 Deploying EncryptionHelper...");
    const EncryptionHelper = await ethers.getContractFactory("EncryptionHelper");
    const encryptionHelper = await EncryptionHelper.deploy();
    await encryptionHelper.waitForDeployment();
    const encryptionHelperAddress = await encryptionHelper.getAddress();
    console.log("✅ EncryptionHelper deployed to:", encryptionHelperAddress);

    // Deploy ProcurementWorkflow
    console.log("📦 Deploying ProcurementWorkflow...");
    const ProcurementWorkflow = await ethers.getContractFactory("ProcurementWorkflow");
    const workflow = await ProcurementWorkflow.deploy(
        x402Address,
        ap2Address,
        encryptionHelperAddress
    );
    await workflow.waitForDeployment();
    const workflowAddress = await workflow.getAddress();
    console.log("✅ ProcurementWorkflow deployed to:", workflowAddress);

    // Save deployment addresses
    const deployment = {
        network: await ethers.provider.getNetwork().then(n => n.name),
        chainId: await ethers.provider.getNetwork().then(n => n.chainId.toString()),
        deployer: deployer.address,
        timestamp: new Date().toISOString(),
        contracts: {
            ProcurementWorkflow: workflowAddress,
            MockX402: x402Address,
            MockAP2: ap2Address,
            EncryptionHelper: encryptionHelperAddress,
        },
    };

    const deploymentPath = path.join(__dirname, "../deployments");
    if (!fs.existsSync(deploymentPath)) {
        fs.mkdirSync(deploymentPath, { recursive: true });
    }

    const filename = `deployment-${deployment.network}-${Date.now()}.json`;
    fs.writeFileSync(
        path.join(deploymentPath, filename),
        JSON.stringify(deployment, null, 2)
    );

    // Also save as latest
    fs.writeFileSync(
        path.join(deploymentPath, "latest.json"),
        JSON.stringify(deployment, null, 2)
    );

    console.log("\n📄 Deployment saved to:", filename);

    console.log("\n🎉 Deployment complete!");
    console.log("\n📋 Contract Addresses:");
    console.log("   ProcurementWorkflow:", workflowAddress);
    console.log("   MockX402:", x402Address);
    console.log("   MockAP2:", ap2Address);
    console.log("   EncryptionHelper:", encryptionHelperAddress);

    console.log("\n💡 Next steps:");
    console.log("   1. Update your .env file with these contract addresses");
    console.log("   2. Verify contracts on block explorer (if applicable)");
    console.log("   3. Start the backend service");
    console.log("   4. Launch the frontend dashboard");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
