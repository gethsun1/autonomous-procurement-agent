/**
 * verifyErc8004Registration.ts — Extended Phase E Validation
 *
 * Checks (all must pass):
 *  1. agentType() returns "procurement"
 *  2. agentMetadataURI() returns non-empty URI
 *  3. agentMetadataURI resolves with HTTP 200 (if HTTPS) or skipped (data: URI)
 *  4. version() returns a semver string
 *  5. supportsInterface(ERC165_ID) returns true
 *  6. supportsInterface(ERC8004_ID) returns true
 *  7. registry.isRegistered(agent) returns true
 *  8. Registry record is active + agentType matches
 *  9. validateRegistry(localRegistry) returns true (on-chain self-validation)
 * 10. X402Escrow.workflowContract == ProcurementWorkflow address
 * 11. AP2Settlement.workflowContract == ProcurementWorkflow address
 * 12. AP2Settlement.x402Escrow == X402Escrow address
 *
 * Usage:
 *   npx hardhat run scripts/verifyErc8004Registration.ts --network skale
 */
import { ethers } from "hardhat";
import * as fs from "fs";
import * as path from "path";
import * as https from "https";
import * as http from "http";

// ── Type Definitions ─────────────────────────────────────────────────────────
type CheckResult = { check: string; pass: boolean; detail: string };

// ── Helper: HTTP(S) resolve check ────────────────────────────────────────────
function checkURLResolves(url: string): Promise<{ status: number; ok: boolean }> {
    return new Promise((resolve) => {
        const lib = url.startsWith("https://") ? https : http;
        const req = lib.request(url, { method: "HEAD", timeout: 8000 }, (res) => {
            resolve({ status: res.statusCode ?? 0, ok: (res.statusCode ?? 0) === 200 });
        });
        req.on("error", () => resolve({ status: 0, ok: false }));
        req.on("timeout", () => { req.destroy(); resolve({ status: 0, ok: false }); });
        req.end();
    });
}

// ── Helper: compute ERC-8004 interface ID ────────────────────────────────────
function computeERC8004InterfaceId(): string {
    const selectors = [
        "agentType()",
        "agentMetadataURI()",
        "version()",
        "execute(bytes)",
        "supportsInterface(bytes4)",
        "validateRegistry(address)",
    ].map(sig => parseInt(ethers.id(sig).slice(2, 10), 16));

    const xorResult = selectors.reduce((a, b) => a ^ b);
    return "0x" + xorResult.toString(16).padStart(8, "0");
}

async function main() {
    console.log("\n🔍 ERC-8004 Extended Verification (Phase E)\n" + "═".repeat(58));

    // Load deployment
    const deploymentPath = path.join(__dirname, "../deployments/latest.json");
    if (!fs.existsSync(deploymentPath)) {
        throw new Error("No deployment found. Run deploy script first.");
    }
    const deployment = JSON.parse(fs.readFileSync(deploymentPath, "utf8"));
    const { contracts, erc8004 } = deployment;

    const [signer] = await ethers.getSigners();
    console.log(`Verifier:  ${signer.address}`);
    console.log(`Network:   ${deployment.network} (chainId: ${deployment.chainId})\n`);
    console.log(`Contracts:`);
    console.log(`  ProcurementWorkflow : ${contracts.ProcurementWorkflow}`);
    console.log(`  X402Escrow          : ${contracts.X402Escrow}`);
    console.log(`  AP2Settlement       : ${contracts.AP2Settlement}`);
    console.log(`  ERC8004Registry     : ${contracts.ERC8004Registry}\n`);

    // ── ABIs ──────────────────────────────────────────────────────────────────
    const workflowABI = [
        "function agentType() external view returns (string)",
        "function agentMetadataURI() external view returns (string)",
        "function version() external pure returns (string)",
        "function supportsInterface(bytes4) external view returns (bool)",
        "function validateRegistry(address) external view returns (bool)",
        "function x402Escrow() external view returns (address)",
        "function ap2Settlement() external view returns (address)",
    ];
    const registryABI = [
        "function isRegistered(address) external view returns (bool)",
        "function getAgent(address) external view returns (tuple(address agentAddress, string agentType, string metadataURI, address registrant, uint256 registeredAt, bool active))",
    ];
    const escrowABI = [
        "function workflowContract() external view returns (address)",
    ];
    const ap2ABI = [
        "function workflowContract() external view returns (address)",
        "function x402Escrow() external view returns (address)",
    ];

    const workflow = new ethers.Contract(contracts.ProcurementWorkflow, workflowABI, signer);
    const registry = new ethers.Contract(contracts.ERC8004Registry, registryABI, signer);
    const escrow = new ethers.Contract(contracts.X402Escrow, escrowABI, signer);
    const ap2 = new ethers.Contract(contracts.AP2Settlement, ap2ABI, signer);

    const results: CheckResult[] = [];
    let allPassed = true;

    function check(label: string, pass: boolean, detail: string) {
        results.push({ check: label, pass, detail });
        if (!pass) allPassed = false;
    }

    // ── Phase E Checks ────────────────────────────────────────────────────────

    // 1. agentType()
    const agentType = await workflow.agentType();
    check("agentType() == 'procurement'", agentType === "procurement", `"${agentType}"`);

    // 2. agentMetadataURI() non-empty
    const metadataURI = await workflow.agentMetadataURI();
    check("agentMetadataURI() non-empty", metadataURI.length > 0, `${metadataURI.length} chars`);

    // 3. agentMetadataURI resolves (only for HTTP/HTTPS — data: URIs are inline)
    if (metadataURI.startsWith("https://") || metadataURI.startsWith("http://")) {
        const { status, ok } = await checkURLResolves(metadataURI);
        check("agentMetadataURI resolves HTTP 200", ok, `HTTP ${status}`);
    } else if (metadataURI.startsWith("ipfs://")) {
        // Can't resolve IPFS without gateway — mark as manual
        check("agentMetadataURI resolves (IPFS — manual)", true, "IPFS URI requires gateway verification");
    } else if (metadataURI.startsWith("data:")) {
        // Inline data: URI — always resolves
        check("agentMetadataURI is inline data: URI", true, "Inline — no HTTP needed");
    } else {
        check("agentMetadataURI has known scheme", false, `Unknown URI scheme: ${metadataURI.slice(0, 30)}`);
    }

    // 4. version() semver
    const ver = await workflow.version();
    const semverRe = /^\d+\.\d+\.\d+$/;
    check("version() returns semver", semverRe.test(ver), `"${ver}"`);

    // 5. supportsInterface(ERC165_ID)
    const ERC165_ID = "0x01ffc9a7";
    const supportsERC165 = await workflow.supportsInterface(ERC165_ID);
    check("supportsInterface(ERC165_ID)", supportsERC165, `ID: ${ERC165_ID}`);

    // 6. supportsInterface(ERC8004_ID)
    const ERC8004_ID = computeERC8004InterfaceId();
    console.log(`  Computed ERC8004_INTERFACE_ID: ${ERC8004_ID}`);
    const supportsERC8004 = await workflow.supportsInterface(ERC8004_ID);
    check("supportsInterface(ERC8004_ID)", supportsERC8004, `ID: ${ERC8004_ID}`);

    // 7. registry.isRegistered(agent)
    const isRegistered = await registry.isRegistered(contracts.ProcurementWorkflow);
    check("registry.isRegistered(agent)", isRegistered, `agent: ${contracts.ProcurementWorkflow}`);

    // 8. Registry record integrity
    const record = await registry.getAgent(contracts.ProcurementWorkflow);
    check("registry record active", record.active, `registered: ${new Date(Number(record.registeredAt) * 1000).toISOString()}`);
    check("registry agentType matches", record.agentType === agentType, `"${record.agentType}"`);

    // 9. validateRegistry() — on-chain self-validation (Phase A requirement)
    const selfValidates = await workflow.validateRegistry(contracts.ERC8004Registry);
    check("workflow.validateRegistry(localRegistry)", selfValidates, `registry: ${contracts.ERC8004Registry}`);

    // 10. X402Escrow.workflowContract binding
    const escrowBound = await escrow.workflowContract();
    check(
        "X402Escrow.workflowContract == workflow",
        escrowBound.toLowerCase() === contracts.ProcurementWorkflow.toLowerCase(),
        `${escrowBound}`
    );

    // 11. AP2Settlement.workflowContract binding
    const ap2Bound = await ap2.workflowContract();
    check(
        "AP2Settlement.workflowContract == workflow",
        ap2Bound.toLowerCase() === contracts.ProcurementWorkflow.toLowerCase(),
        `${ap2Bound}`
    );

    // 12. AP2Settlement.x402Escrow binding
    const ap2EscrowRef = await ap2.x402Escrow();
    check(
        "AP2Settlement.x402Escrow == X402Escrow",
        ap2EscrowRef.toLowerCase() === contracts.X402Escrow.toLowerCase(),
        `${ap2EscrowRef}`
    );

    // ── Print Results ─────────────────────────────────────────────────────────
    console.log("\nCheck Results:\n");
    for (const r of results) {
        const icon = r.pass ? "✅" : "❌";
        console.log(`  ${icon}  ${r.check.padEnd(48)} ${r.detail}`);
    }

    const passed = results.filter(r => r.pass).length;
    const failed = results.filter(r => !r.pass).length;

    console.log("\n" + "═".repeat(58));
    console.log(`Results: ${passed}/${results.length} passed, ${failed} failed`);
    console.log("═".repeat(58));

    if (allPassed) {
        console.log("✅ ALL CHECKS PASSED — Agent fully verified on-chain\n");
        if (erc8004?.registrationTxHash) {
            console.log(`🔗 Registration:  https://base-sepolia.explorer.skale.network/tx/${erc8004.registrationTxHash}`);
        }
        console.log(`   Agent:         https://base-sepolia.explorer.skale.network/address/${contracts.ProcurementWorkflow}`);
        console.log(`   IdentityReg:   https://base-sepolia-testnet-explorer.skalenodes.com/address/0x8004A818BFB912233c491871b3d84c89A494BD9e`);
        console.log(`   ReputationReg: https://base-sepolia-testnet-explorer.skalenodes.com/address/0x8004B663056A597Dffe9eCcC1965A193B7388713`);
    } else {
        console.error(`\n❌ ${failed} CHECK(S) FAILED\n`);
        for (const r of results.filter(r => !r.pass)) {
            console.error(`   FAILED: ${r.check} → ${r.detail}`);
        }
        process.exit(1);
    }
    console.log("═".repeat(58) + "\n");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("Verification error:", error);
        process.exit(1);
    });
