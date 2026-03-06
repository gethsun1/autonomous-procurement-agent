import { ethers } from "hardhat";
import * as fs from "fs";
import * as path from "path";

async function main() {
    console.log("🚀 Starting Stress Test...");
    const deploymentPath = path.join(__dirname, "../deployments/latest.json");
    if (!fs.existsSync(deploymentPath)) {
        throw new Error("Deployment not found");
    }
    const deployment = JSON.parse(fs.readFileSync(deploymentPath, "utf8"));
    const [deployer] = await ethers.getSigners();

    console.log("Account:", deployer.address);
    const balance = await ethers.provider.getBalance(deployer.address);
    console.log("Balance:", ethers.formatEther(balance), "sFUEL");

    const workflow = await ethers.getContractAt(
        "ProcurementWorkflow",
        deployment.contracts.ProcurementWorkflow,
        deployer
    );
    const ap2 = await ethers.getContractAt(
        "AP2Settlement",
        deployment.contracts.AP2Settlement,
        deployer
    );
    const usdc = await ethers.getContractAt(
        "DemoUSDC",
        deployment.contracts.DemoUSDC,
        deployer
    );

    // Gas Estimates
    console.log("Checking Gas Estimates...");
    const brief = "Stress Test Brief";
    const constraints = ethers.toUtf8Bytes("Encrypted");
    const createGas = await workflow.createWorkflow.estimateGas(brief, constraints);
    console.log("- createWorkflow:", createGas.toString());

    // Create one workflow for replay and failures
    const createTx = await workflow.createWorkflow(brief, constraints);
    const rc = await createTx.wait();
    const wfLog = rc!.logs.find((l: any) => l.fragment?.name === "WorkflowCreated");
    const wfId = wfLog!.args!.workflowId;
    console.log("Test Workflow ID:", wfId.toString());

    // Discovery -> Evaluation
    await (await workflow.startDiscovery(wfId)).wait();
    await (await workflow.startEvaluation(wfId, ethers.id("mockHash"))).wait();

    // Vendor Selection
    await (await workflow.selectVendor(wfId, "VENDOR_1", ethers.parseUnits("1", 6))).wait();

    // Insufficient balance / allowance test
    console.log("Testing Insufficient Balance / Allowance...");
    try {
        await workflow.executePayment.estimateGas(wfId, "0x1111111111111111111111111111111111111111");
        console.log("❌ Should have failed execution due to no allowance!");
    } catch (e: any) {
        console.log("✅ Expected failure on insufficient allowance:", e.message.split("\\n")[0].substring(0, 100));
    }

    console.log("Approving token...");
    await (await usdc.approve(deployment.contracts.X402Escrow, ethers.parseUnits("1", 6))).wait();

    // Execute Payment
    console.log("Executing Payment...");
    await (await workflow.executePayment(wfId, "0x1111111111111111111111111111111111111111")).wait();

    // Finalize Settlement
    console.log("Finalizing Settlement...");
    await (await workflow.finalizeSettlement(wfId)).wait();

    // Replay Attempt
    console.log("Testing Settlement Replay...");
    try {
        await workflow.finalizeSettlement.estimateGas(wfId);
        console.log("❌ Should have failed replay!");
    } catch (e: any) {
        console.log("✅ Expected failure on replay:", e.message.split("\\n")[0].substring(0, 100));
    }

    console.log("Stress Testing Complete.");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
