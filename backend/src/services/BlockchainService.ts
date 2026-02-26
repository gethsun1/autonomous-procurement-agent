import { ethers } from "ethers";
import * as fs from "fs";
import * as path from "path";

export interface ContractAddresses {
    ProcurementWorkflow: string;
    X402Escrow: string;
    AP2Settlement: string;
    EncryptionHelper: string;
    ERC8004Registry?: string;
    DemoUSDC?: string; // ERC-20 payment token (6 decimals)
}

export interface ChainWorkflowState {
    workflowId: number;
    state: string;
    procurementBrief: string;
    selectedVendorId: string;
    paymentAmount: string | null;
    paymentTxHash: string;
    createdAt: number;
    completedAt: number;
    // Cross-contract chain data
    paymentExecuted: boolean;
    settlementFinalized: boolean;
    scaledAmountWei: string | null;
    paymentScaleDivisor: number;
}

export class BlockchainService {
    private provider: ethers.Provider;
    private signer: ethers.Signer;
    private paymentScaleDivisor: number;
    private contracts: {
        workflow?: ethers.Contract;
        x402?: ethers.Contract;
        ap2?: ethers.Contract;
        encryptionHelper?: ethers.Contract;
        demoUsdc?: ethers.Contract; // ERC-20 payment token
    } = {};
    private usdcMode: boolean = false; // true when DemoUSDC is configured
    private usdcDecimals: number = 6;

    constructor(rpcUrl: string, privateKey: string, paymentScaleDivisor = 1_000_000) {
        this.provider = new ethers.JsonRpcProvider(rpcUrl);
        this.signer = new ethers.Wallet(privateKey, this.provider);
        this.paymentScaleDivisor = paymentScaleDivisor;
        if (paymentScaleDivisor !== 1) {
            console.log(
                `⚠️  Payment scale divisor set to ${paymentScaleDivisor}. ` +
                `Dollar amounts will be divided by ${paymentScaleDivisor} for testnet sFUEL. ` +
                `This is visible in the UI.`
            );
        }
    }

    /**
     * Initialize contracts with addresses
     */
    async initializeContracts(addresses: ContractAddresses) {
        // Load ABIs from compiled contracts
        const workflowABI = this.loadABI("ProcurementWorkflow");
        const x402ABI = this.loadABI("X402Escrow");     // renamed from MockX402
        const ap2ABI = this.loadABI("AP2Settlement");   // renamed from MockAP2
        const encryptionHelperABI = this.loadABI("EncryptionHelper");

        this.contracts.workflow = new ethers.Contract(
            addresses.ProcurementWorkflow,
            workflowABI,
            this.signer
        );

        // Support both old (MockX402) and new (X402Escrow) key names
        const x402Addr = addresses.X402Escrow || (addresses as any).MockX402;
        this.contracts.x402 = new ethers.Contract(x402Addr, x402ABI, this.signer);

        // Support both old (MockAP2) and new (AP2Settlement) key names
        const ap2Addr = addresses.AP2Settlement || (addresses as any).MockAP2;
        this.contracts.ap2 = new ethers.Contract(ap2Addr, ap2ABI, this.signer);

        this.contracts.encryptionHelper = new ethers.Contract(
            addresses.EncryptionHelper,
            encryptionHelperABI,
            this.signer
        );

        // DemoUSDC ERC-20 token (optional — set DEMO_USDC_ADDRESS in .env)
        if (addresses.DemoUSDC) {
            const erc20ABI = [
                "function approve(address spender, uint256 amount) external returns (bool)",
                "function allowance(address owner, address spender) external view returns (uint256)",
                "function balanceOf(address) external view returns (uint256)",
                "function decimals() external view returns (uint8)",
                "function symbol() external view returns (string)",
                "function claimFaucet() external",
            ];
            this.contracts.demoUsdc = new ethers.Contract(addresses.DemoUSDC, erc20ABI, this.signer);
            this.usdcMode = true;
            console.log(`💵 DemoUSDC ERC-20 mode enabled: ${addresses.DemoUSDC}`);
        }

        console.log("✅ Blockchain service initialized with contracts");
    }

    /**
     * Create a new procurement workflow
     */
    async createWorkflow(
        procurementBrief: string,
        encryptedConstraints: Buffer
    ): Promise<number> {
        if (!this.contracts.workflow) {
            throw new Error("Contracts not initialized");
        }

        const tx = await this.contracts.workflow.createWorkflow(
            procurementBrief,
            encryptedConstraints
        );

        const receipt = await tx.wait();

        // Extract workflow ID from event
        const event = receipt.logs.find(
            (log: any) =>
                log.fragment && log.fragment.name === "WorkflowCreated"
        );

        if (event && event.args) {
            return Number(event.args.workflowId);
        }

        throw new Error("Failed to extract workflow ID from transaction");
    }

    /**
     * Start discovery phase
     */
    async startDiscovery(workflowId: number) {
        if (!this.contracts.workflow) {
            throw new Error("Contracts not initialized");
        }

        const tx = await this.contracts.workflow.startDiscovery(workflowId);
        await tx.wait();
    }

    /**
     * Start evaluation with decision hash
     */
    async startEvaluation(workflowId: number, decisionHash: string) {
        if (!this.contracts.workflow) {
            throw new Error("Contracts not initialized");
        }

        const tx = await this.contracts.workflow.startEvaluation(
            workflowId,
            decisionHash
        );
        await tx.wait();
    }

    /**
     * Select vendor
     */
    async selectVendor(
        workflowId: number,
        vendorId: string,
        paymentAmount: number
    ) {
        if (!this.contracts.workflow) {
            throw new Error("Contracts not initialized");
        }

        const tx = await this.contracts.workflow.selectVendor(
            workflowId,
            vendorId,
            ethers.parseEther(paymentAmount.toString())
        );
        await tx.wait();
    }

    /**
     * Execute payment via ProcurementWorkflow.
     * ERC-20 mode (DemoUSDC): approve X402Escrow first, then call without ETH.
     * ETH mode: call with payable ETH scaled by paymentScaleDivisor.
     */
    async executePayment(
        workflowId: number,
        vendorAddress: string,
        amount: number
    ): Promise<string> {
        if (!this.contracts.workflow) {
            throw new Error("Contracts not initialized");
        }

        if (this.usdcMode && this.contracts.x402 && this.contracts.demoUsdc) {
            // ERC-20 path: amount is in USD dollars, convert to 6-decimal USDC units
            const usdcAmount = ethers.parseUnits(amount.toString(), 6);
            console.log(`💰 ERC-20 Payment: ${amount} USDC (→ ${usdcAmount} raw units)`);
            console.log(`   Vendor: ${vendorAddress}`);

            // Check allowance — approve more if needed
            const signerAddr = await this.signer.getAddress();
            const x402Addr = await this.contracts.x402.getAddress();
            const currentAllowance: bigint = await this.contracts.demoUsdc.allowance(signerAddr, x402Addr);

            if (currentAllowance < usdcAmount) {
                console.log(`   Allowance insufficient (${currentAllowance}), approving ${usdcAmount}...`);
                const approveTx = await this.contracts.demoUsdc.approve(x402Addr, usdcAmount * 10n);
                await approveTx.wait();
                console.log(`   ✅ Approved`);
            }

            // Call workflow.executePayment (no msg.value needed in ERC-20 mode)
            const tx = await this.contracts.workflow.executePayment(workflowId, vendorAddress);
            const receipt = await tx.wait();

            const event = receipt.logs.find(
                (log: any) => log.fragment && log.fragment.name === "PaymentTriggered"
            );
            if (event && event.args) return event.args.txHash;
            throw new Error("PaymentTriggered event not found in receipt");
        } else {
            // ETH path (sFUEL on SKALE)
            const scaledAmount = amount / this.paymentScaleDivisor;
            const amountWei = ethers.parseEther(scaledAmount.toString());

            console.log(`💰 ETH Payment: $${amount} USD → ${scaledAmount} sFUEL (÷${this.paymentScaleDivisor})`);

            const tx = await this.contracts.workflow.executePayment(
                workflowId,
                vendorAddress,
                { value: amountWei }
            );
            const receipt = await tx.wait();

            const event = receipt.logs.find(
                (log: any) => log.fragment && log.fragment.name === "PaymentTriggered"
            );
            if (event && event.args) return event.args.txHash;
            throw new Error("PaymentTriggered event not found in receipt");
        }
    }

    /**
     * Finalize settlement via AP2Settlement.
     * ProcurementWorkflow.finalizeSettlement() atomically calls
     * AP2Settlement.initiateSettlement + finalizeSettlement — which
     * cross-verifies the X402Escrow payment was executed on-chain.
     */
    async finalizeSettlement(workflowId: number, paymentTxHash: string, amount: number) {
        if (!this.contracts.workflow) {
            throw new Error("Contracts not initialized");
        }

        // Settlement is now fully handled inside ProcurementWorkflow.finalizeSettlement()
        // which calls AP2Settlement, which cross-verifies X402Escrow state
        const workflowTx = await this.contracts.workflow.finalizeSettlement(workflowId);
        await workflowTx.wait();
    }

    /**
     * Complete workflow
     */
    async completeWorkflow(workflowId: number) {
        if (!this.contracts.workflow) {
            throw new Error("Contracts not initialized");
        }

        const tx = await this.contracts.workflow.completeWorkflow(workflowId);
        await tx.wait();
    }

    /**
     * Get workflow state
     */
    async getWorkflowState(workflowId: number): Promise<number> {
        if (!this.contracts.workflow) {
            throw new Error("Contracts not initialized");
        }

        return await this.contracts.workflow.getState(workflowId);
    }

    /**
     * Get full workflow details
     */
    async getWorkflow(workflowId: number): Promise<any> {
        if (!this.contracts.workflow) {
            throw new Error("Contracts not initialized");
        }

        return await this.contracts.workflow.getWorkflow(workflowId);
    }

    /**
     * Load contract ABI
     */
    private loadABI(contractName: string): any[] {
        try {
            const artifactPath = path.join(
                __dirname,
                "../../..",
                "contracts",
                "artifacts",
                "src",
                `${contractName}.sol`,
                `${contractName}.json`
            );

            const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf8"));
            return artifact.abi;
        } catch (error) {
            console.error(`Failed to load ABI for ${contractName}:`, error);
            throw error;
        }
    }

    /**
     * Fetch authoritative workflow state from chain (Phase 4 — chain as source of truth).
     * Combines data from:
     *   - ProcurementWorkflow (state, ids, hashes)
     *   - X402Escrow (payment executed flag)
     *   - AP2Settlement (settlement finalized flag)
     *
     * If backend restarts, this still returns correct state from chain.
     */
    async getFullWorkflowState(workflowId: number): Promise<ChainWorkflowState | null> {
        if (!this.contracts.workflow) {
            return null;
        }

        try {
            const workflow = await this.contracts.workflow.getWorkflow(workflowId);

            const stateMap: { [key: number]: string } = {
                0: "Initialized",
                1: "Discovery",
                2: "Evaluation",
                3: "Selection",
                4: "PaymentPending",
                5: "Settled",
                6: "Completed"
            };

            // Cross-check payment execution in X402Escrow
            let paymentExecuted = false;
            let scaledAmountWei: string | null = null;
            const txHash = workflow.paymentTxHash;

            if (txHash && txHash !== ethers.ZeroHash && this.contracts.x402) {
                try {
                    const payment = await this.contracts.x402.getPayment(txHash);
                    paymentExecuted = payment.executed;
                    scaledAmountWei = payment.amount?.toString() || null;
                } catch { /* escrow may not have this payment if not yet initiated */ }
            }

            // Cross-check settlement finalization in AP2Settlement
            let settlementFinalized = false;
            if (this.contracts.ap2) {
                try {
                    settlementFinalized = await this.contracts.ap2.isFinalized(workflowId);
                } catch { /* settlement may not exist yet */ }
            }

            return {
                workflowId: Number(workflow.id),
                state: stateMap[Number(workflow.state)] || "Initialized",
                procurementBrief: workflow.procurementBrief,
                selectedVendorId: workflow.selectedVendorId,
                paymentAmount: workflow.paymentAmount ? ethers.formatEther(workflow.paymentAmount) : null,
                paymentTxHash: txHash,
                createdAt: Number(workflow.createdAt),
                completedAt: Number(workflow.completedAt),
                paymentExecuted,
                settlementFinalized,
                scaledAmountWei,
                paymentScaleDivisor: this.paymentScaleDivisor,
            };
        } catch (error) {
            console.error(`Error fetching workflow ${workflowId} from chain:`, error);
            return null;
        }
    }

    /**
     * @deprecated Use getFullWorkflowState() — this is kept for backward compatibility.
     */
    async getWorkflowFromBlockchain(workflowId: number) {
        return this.getFullWorkflowState(workflowId);
    }
}
