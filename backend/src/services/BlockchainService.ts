import { ethers } from "ethers";
import * as fs from "fs";
import * as path from "path";

export interface ContractAddresses {
    ProcurementWorkflow: string;
    MockX402: string;
    MockAP2: string;
    EncryptionHelper: string;
}

export class BlockchainService {
    private provider: ethers.Provider;
    private signer: ethers.Signer;
    private contracts: {
        workflow?: ethers.Contract;
        x402?: ethers.Contract;
        ap2?: ethers.Contract;
        encryptionHelper?: ethers.Contract;
    } = {};

    constructor(rpcUrl: string, privateKey: string) {
        this.provider = new ethers.JsonRpcProvider(rpcUrl);
        this.signer = new ethers.Wallet(privateKey, this.provider);
    }

    /**
     * Initialize contracts with addresses
     */
    async initializeContracts(addresses: ContractAddresses) {
        // Load ABIs from compiled contracts
        const workflowABI = this.loadABI("ProcurementWorkflow");
        const x402ABI = this.loadABI("MockX402");
        const ap2ABI = this.loadABI("MockAP2");
        const encryptionHelperABI = this.loadABI("EncryptionHelper");

        this.contracts.workflow = new ethers.Contract(
            addresses.ProcurementWorkflow,
            workflowABI,
            this.signer
        );

        this.contracts.x402 = new ethers.Contract(
            addresses.MockX402,
            x402ABI,
            this.signer
        );

        this.contracts.ap2 = new ethers.Contract(
            addresses.MockAP2,
            ap2ABI,
            this.signer
        );

        this.contracts.encryptionHelper = new ethers.Contract(
            addresses.EncryptionHelper,
            encryptionHelperABI,
            this.signer
        );

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
     * Execute payment via x402
     */
    async executePayment(
        workflowId: number,
        vendorAddress: string,
        amount: number
    ): Promise<string> {
        if (!this.contracts.x402) {
            throw new Error("Contracts not initialized");
        }

        // Scale down payment for demo: divide by 10000 to convert $380 -> 0.038 sFUEL
        // This allows testing with limited testnet sFUEL balance
        const scaledAmount = amount / 10000;
        const amountWei = ethers.parseEther(scaledAmount.toString());

        console.log(`💰 Payment: $${amount} (scaled to ${scaledAmount} sFUEL for demo)`);

        const tx = await this.contracts.x402.initiatePayment(
            workflowId,
            vendorAddress,
            amountWei,
            { value: amountWei }
        );

        const receipt = await tx.wait();

        // Extract transaction hash
        const event = receipt.logs.find(
            (log: any) =>
                log.fragment && log.fragment.name === "PaymentInitiated"
        );

        if (event && event.args) {
            const txHash = event.args.txHash;

            // Execute the payment
            const executeTx = await this.contracts.x402.executePayment(txHash);
            await executeTx.wait();

            // Update workflow
            if (this.contracts.workflow) {
                const updateTx = await this.contracts.workflow.executePayment(
                    workflowId,
                    txHash
                );
                await updateTx.wait();
            }

            return txHash;
        }

        throw new Error("Failed to execute payment");
    }

    /**
     * Finalize settlement via AP2
     */
    async finalizeSettlement(workflowId: number, paymentTxHash: string, amount: number) {
        if (!this.contracts.ap2 || !this.contracts.workflow) {
            throw new Error("Contracts not initialized");
        }

        // Scale down amount to match payment scaling
        const scaledAmount = amount / 10000;
        const amountWei = ethers.parseEther(scaledAmount.toString());

        // Initiate settlement
        const initTx = await this.contracts.ap2.initiateSettlement(
            workflowId,
            paymentTxHash,
            amountWei
        );
        await initTx.wait();

        // Finalize settlement
        const finalizeTx = await this.contracts.ap2.finalizeSettlement(workflowId);
        await finalizeTx.wait();

        // Update workflow
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
}
