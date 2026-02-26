/**
 * deploy.ts — Full deployment for Autonomous Procurement Agent
 *
 * Deploys in order:
 *   1. DemoUSDC       — Custom ERC-20 (6 decimals, "USDC" symbol)
 *   2. ERC8004Registry — On-chain ERC-8004 agent registry
 *   3. EncryptionHelper
 *   4. X402Escrow      — Bound to predicted workflow address, uses DemoUSDC
 *   5. AP2Settlement   — Bound to X402 + predicted workflow
 *   6. ProcurementWorkflow — ERC-8004 agent contract
 *
 * Post-deploy:
 *   - Registers agent in ERC8004Registry
 *   - Mints 10,000 DemoUSDC to deployer (requester demo wallet)
 *   - Mints 1,000  DemoUSDC to each simulated vendor wallet
 *   - Saves deployment to contracts/deployments/latest.json
 *   - Prints .env block to paste
 */
import { ethers } from "hardhat";
import * as fs from "fs";
import * as path from "path";

// Simulated vendor wallets (from VendorData.ts)
const VENDOR_WALLETS = [
    "0x1111111111111111111111111111111111111111", // ChainMetrics Pro
    "0x2222222222222222222222222222222222222222", // BlockInsight API
    "0x3333333333333333333333333333333333333333", // CryptoData Hub
    "0x4444444444444444444444444444444444444444", // OmniChain Analytics
    "0x5555555555555555555555555555555555555555", // DataChain Essentials
];

async function main() {
    console.log("\n🚀 Autonomous Procurement Agent — Full Deployment\n" + "═".repeat(60));

    const [deployer] = await ethers.getSigners();
    const network = await ethers.provider.getNetwork();
    const balance = await ethers.provider.getBalance(deployer.address);
    let currentNonce = await ethers.provider.getTransactionCount(deployer.address);

    console.log(`Network:   ${network.name} (chainId: ${network.chainId})`);
    console.log(`Deployer:  ${deployer.address}`);
    console.log(`Balance:   ${ethers.formatEther(balance)} sFUEL`);
    console.log(`Nonce:     ${currentNonce}\n`);

    if (balance === 0n) {
        throw new Error(
            "Deployer has no sFUEL. Fund at: https://sfuel.skale.network/"
        );
    }

    // ── 1. DemoUSDC ────────────────────────────────────────────────────────────
    console.log("📦 [1/6] Deploying DemoUSDC...");
    const DemoUSDC = await ethers.getContractFactory("DemoUSDC");
    const demoUSDC = await DemoUSDC.deploy(deployer.address);
    await demoUSDC.waitForDeployment();
    const demoUSDCAddress = await demoUSDC.getAddress();
    console.log(`   ✅ DemoUSDC : ${demoUSDCAddress}`);
    console.log(`      Symbol  : ${await demoUSDC.symbol()}`);
    console.log(`      Decimals: ${await demoUSDC.decimals()}`);
    const totalSupply = await demoUSDC.totalSupply();
    console.log(`      Supply  : ${ethers.formatUnits(totalSupply, 6)} USDC`);
    currentNonce++;

    // ── 2. ERC8004Registry ─────────────────────────────────────────────────────
    console.log("\n📦 [2/6] Deploying ERC8004Registry...");
    const ERC8004Registry = await ethers.getContractFactory("ERC8004Registry");
    const registry = await ERC8004Registry.deploy();
    await registry.waitForDeployment();
    const registryAddress = await registry.getAddress();
    console.log(`   ✅ ERC8004Registry: ${registryAddress}`);
    currentNonce++;

    // ── 3. EncryptionHelper ────────────────────────────────────────────────────
    console.log("\n📦 [3/6] Deploying EncryptionHelper...");
    const EncryptionHelper = await ethers.getContractFactory("EncryptionHelper");
    const encryptionHelper = await EncryptionHelper.deploy();
    await encryptionHelper.waitForDeployment();
    const encryptionHelperAddress = await encryptionHelper.getAddress();
    console.log(`   ✅ EncryptionHelper: ${encryptionHelperAddress}`);
    currentNonce++;

    // ── 4. Predict ProcurementWorkflow address ─────────────────────────────────
    // Order: X402(currentNonce) → AP2(+1) → Workflow(+2)
    const workflowNonce = currentNonce + 2;
    const predictedWorkflowAddress = ethers.getCreateAddress({
        from: deployer.address,
        nonce: workflowNonce,
    });
    console.log(`\n🔮 Predicted ProcurementWorkflow @ nonce ${workflowNonce}: ${predictedWorkflowAddress}`);

    // ── 5. X402Escrow ──────────────────────────────────────────────────────────
    console.log("\n📦 [4/6] Deploying X402Escrow (DemoUSDC mode)...");
    const X402Escrow = await ethers.getContractFactory("X402Escrow");
    const x402 = await X402Escrow.deploy(predictedWorkflowAddress, demoUSDCAddress);
    await x402.waitForDeployment();
    const x402Address = await x402.getAddress();
    console.log(`   ✅ X402Escrow     : ${x402Address}`);
    console.log(`   🔗 Payment token  : ${demoUSDCAddress} (DemoUSDC)`);
    console.log(`   🔗 Workflow bound : ${predictedWorkflowAddress}`);
    currentNonce++;

    // ── 6. AP2Settlement ───────────────────────────────────────────────────────
    console.log("\n📦 [5/6] Deploying AP2Settlement...");
    const AP2Settlement = await ethers.getContractFactory("AP2Settlement");
    const ap2 = await AP2Settlement.deploy(x402Address, predictedWorkflowAddress);
    await ap2.waitForDeployment();
    const ap2Address = await ap2.getAddress();
    console.log(`   ✅ AP2Settlement: ${ap2Address}`);
    console.log(`   🔗 X402 ref     : ${x402Address}`);
    console.log(`   🔗 Workflow bound: ${predictedWorkflowAddress}`);
    currentNonce++;

    // ── 7. ProcurementWorkflow ─────────────────────────────────────────────────
    console.log("\n📦 [6/6] Deploying ProcurementWorkflow (ERC-8004)...");
    const metadataURI = `data:application/json;base64,${Buffer.from(JSON.stringify({
        name: "Autonomous Procurement Agent",
        description: "Deterministic constrained AI payment agent built on SKALE",
        version: "1.0",
        chain: "SKALE Base Sepolia",
        chainId: network.chainId.toString(),
        agentType: "procurement",
        repository: "https://github.com/gethsun1/autonomous-procurement-agent",
        capabilities: ["vendor-discovery", "ai-evaluation", "escrow-payment", "settlement"],
    })).toString("base64")}`;

    const ProcurementWorkflow = await ethers.getContractFactory("ProcurementWorkflow");
    const workflow = await ProcurementWorkflow.deploy(
        x402Address,
        ap2Address,
        encryptionHelperAddress,
        metadataURI,
        registryAddress
    );
    await workflow.waitForDeployment();
    const workflowAddress = await workflow.getAddress();

    if (workflowAddress.toLowerCase() !== predictedWorkflowAddress.toLowerCase()) {
        console.error("❌ Address prediction MISMATCH!");
        console.error(`   Predicted: ${predictedWorkflowAddress}`);
        console.error(`   Actual:    ${workflowAddress}`);
        console.error("   X402 + AP2 are bound to the wrong address — redeploy.");
        process.exit(1);
    }
    console.log(`   ✅ ProcurementWorkflow: ${workflowAddress}`);
    console.log(`   ✅ Address prediction matched!`);
    currentNonce++;

    // ── 8. ERC-8004 Registration ───────────────────────────────────────────────
    console.log("\n🪪  Registering agent in ERC8004Registry...");
    const agentType = await workflow.agentType();
    const agentMeta = await workflow.agentMetadataURI();

    const registerTx = await (registry as any).registerAgent(workflowAddress, agentType, agentMeta);
    const registerReceipt = await registerTx.wait();
    const registrationTxHash = registerReceipt!.hash;
    const isRegistered = await (registry as any).isRegistered(workflowAddress);
    console.log(`   ✅ Registered (tx: ${registrationTxHash})`);
    console.log(`   On-chain: ${isRegistered ? "✅ REGISTERED" : "❌ FAILED"}`);

    // ── 9. Approve X402Escrow to spend deployer's DemoUSDC ────────────────────
    // The deployer wallet acts as requester. Pre-approve X402Escrow to pull tokens.
    console.log("\n💳 Approving X402Escrow to spend DemoUSDC...");
    const approveAmount = ethers.parseUnits("5000000", 6); // 5M USDC approval
    const approveTx = await demoUSDC.approve(x402Address, approveAmount);
    await approveTx.wait();
    console.log(`   ✅ Approved ${ethers.formatUnits(approveAmount, 6)} USDC for ${x402Address}`);

    // ── 10. Mint DemoUSDC to vendor wallets ────────────────────────────────────
    // Pre-fund simulate vendors so they can demonstrate balance after payment
    console.log("\n💰 Minting DemoUSDC to simulated vendor wallets...");
    const vendorFundAmount = ethers.parseUnits("500", 6); // 500 USDC each
    const mintTx = await demoUSDC.batchMint(VENDOR_WALLETS, vendorFundAmount);
    await mintTx.wait();
    console.log(`   ✅ Minted 500 USDC each to ${VENDOR_WALLETS.length} vendor wallets`);

    // ── 11. Save deployment ────────────────────────────────────────────────────
    const deployment = {
        network: network.name,
        chainId: network.chainId.toString(),
        deployer: deployer.address,
        timestamp: new Date().toISOString(),
        erc8004: {
            registryAddress,
            registrationTxHash,
            agentType,
            isRegistered,
        },
        contracts: {
            ProcurementWorkflow: workflowAddress,
            X402Escrow: x402Address,
            AP2Settlement: ap2Address,
            EncryptionHelper: encryptionHelperAddress,
            ERC8004Registry: registryAddress,
            DemoUSDC: demoUSDCAddress,
        },
        token: {
            address: demoUSDCAddress,
            symbol: "USDC",
            decimals: 6,
            name: "Demo USDC",
            approvedSpender: x402Address,
        },
    };

    const deploymentPath = path.join(__dirname, "../deployments");
    if (!fs.existsSync(deploymentPath)) {
        fs.mkdirSync(deploymentPath, { recursive: true });
    }
    fs.writeFileSync(path.join(deploymentPath, `deployment-${Date.now()}.json`), JSON.stringify(deployment, null, 2));
    fs.writeFileSync(path.join(deploymentPath, "latest.json"), JSON.stringify(deployment, null, 2));

    // ── 12. Summary ────────────────────────────────────────────────────────────
    console.log("\n" + "═".repeat(60));
    console.log("🎉 DEPLOYMENT COMPLETE");
    console.log("═".repeat(60));
    console.log("\n📋 Contracts:");
    console.log(`   DemoUSDC            : ${demoUSDCAddress}`);
    console.log(`   ProcurementWorkflow : ${workflowAddress}`);
    console.log(`   X402Escrow          : ${x402Address}`);
    console.log(`   AP2Settlement       : ${ap2Address}`);
    console.log(`   EncryptionHelper    : ${encryptionHelperAddress}`);
    console.log(`   ERC8004Registry     : ${registryAddress}`);

    console.log("\n🪪  ERC-8004:");
    console.log(`   Tx Hash  : ${registrationTxHash}`);
    console.log(`   Explorer : https://base-sepolia.explorer.skale.network/tx/${registrationTxHash}`);

    console.log("\n📝 Paste into .env:");
    console.log("─".repeat(60));
    console.log(`PROCUREMENT_WORKFLOW_ADDRESS=${workflowAddress}`);
    console.log(`X402_ADDRESS=${x402Address}`);
    console.log(`AP2_ADDRESS=${ap2Address}`);
    console.log(`ENCRYPTION_HELPER_ADDRESS=${encryptionHelperAddress}`);
    console.log(`ERC8004_REGISTRY_ADDRESS=${registryAddress}`);
    console.log(`DEMO_USDC_ADDRESS=${demoUSDCAddress}`);
    console.log("─".repeat(60));

    console.log("\n💡 Next:");
    console.log("   1. Update .env with addresses above");
    console.log("   2. npx hardhat run scripts/verifyErc8004Registration.ts --network skale");
    console.log("   3. cd backend && npm run dev");
    console.log("═".repeat(60) + "\n");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("\n❌ Deployment failed:", error);
        process.exit(1);
    });
