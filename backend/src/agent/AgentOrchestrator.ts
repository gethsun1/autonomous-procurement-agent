import { GeminiEvaluator, EvaluationCriteria, EvaluationResult } from "./GeminiEvaluator";
import { DecisionValidator, DecisionConstraints } from "./DecisionValidator";
import { BlockchainService } from "../services/BlockchainService";
import { EncryptionService } from "../services/EncryptionService";
import { getAllVendors, getVendorById } from "../data/VendorData";

export enum AgentState {
    Idle = "Idle",
    Initialized = "Initialized",
    Discovery = "Discovery",
    Evaluation = "Evaluation",
    Selection = "Selection",
    PaymentPending = "PaymentPending",
    Settled = "Settled",
    Completed = "Completed",
    Error = "Error",
}

export interface ProcurementRequest {
    brief: string;
    maxBudget: number;
    minQualityScore: number;
    preferredSLA: number;
    durationDays: number;
}

export interface WorkflowData {
    workflowId: number;
    state: AgentState;
    request: ProcurementRequest;
    evaluation?: EvaluationResult;
    selectedVendorId?: string;
    paymentTxHash?: string;
    error?: string;
}

/**
 * Main agent orchestrator - coordinates the autonomous procurement flow
 */
export class AgentOrchestrator {
    private geminiEvaluator: GeminiEvaluator;
    private decisionValidator: DecisionValidator;
    private blockchainService: BlockchainService;
    private encryptionService: EncryptionService;
    private workflows: Map<number, WorkflowData> = new Map();

    constructor(
        geminiEvaluator: GeminiEvaluator,
        decisionValidator: DecisionValidator,
        blockchainService: BlockchainService,
        encryptionService: EncryptionService
    ) {
        this.geminiEvaluator = geminiEvaluator;
        this.decisionValidator = decisionValidator;
        this.blockchainService = blockchainService;
        this.encryptionService = encryptionService;
    }

    /**
     * Initialize a new procurement workflow
     */
    async initializeWorkflow(request: ProcurementRequest): Promise<number> {
        console.log("🚀 Initializing procurement workflow...");

        // Encrypt sensitive constraints
        const constraints = {
            maxBudget: request.maxBudget,
            minQualityScore: request.minQualityScore,
            preferredSLA: request.preferredSLA,
        };

        const encryptedData = this.encryptionService.encrypt(constraints);
        const encryptedBuffer = this.encryptionService.toBuffer(encryptedData);

        // Create on-chain workflow
        const workflowId = await this.blockchainService.createWorkflow(
            request.brief,
            encryptedBuffer
        );

        // Store workflow data
        this.workflows.set(workflowId, {
            workflowId,
            state: AgentState.Initialized,
            request,
        });

        console.log(`✅ Workflow ${workflowId} initialized`);

        return workflowId;
    }

    /**
     * Execute the autonomous procurement flow
     */
    async executeAutonomousFlow(workflowId: number): Promise<void> {
        try {
            const workflow = this.workflows.get(workflowId);
            if (!workflow) {
                throw new Error(`Workflow ${workflowId} not found`);
            }

            // Phase 1: Discovery
            await this.discoveryPhase(workflowId);

            // Phase 2: Evaluation
            await this.evaluationPhase(workflowId);

            // Phase 3: Selection
            await this.selectionPhase(workflowId);

            // Phase 4: Payment
            await this.paymentPhase(workflowId);

            // Phase 5: Settlement
            await this.settlementPhase(workflowId);

            // Phase 6: Completion
            await this.completionPhase(workflowId);

            console.log(`🎉 Workflow ${workflowId} completed successfully`);
        } catch (error) {
            console.error(`❌ Workflow ${workflowId} failed:`, error);
            this.updateWorkflowState(workflowId, AgentState.Error, {
                error: error instanceof Error ? error.message : String(error),
            });
            throw error;
        }
    }

    /**
     * Discovery: Load available vendors
     */
    private async discoveryPhase(workflowId: number) {
        console.log(`🔍 Discovery phase for workflow ${workflowId}...`);

        await this.blockchainService.startDiscovery(workflowId);
        this.updateWorkflowState(workflowId, AgentState.Discovery);

        // In production, this would query real vendor APIs
        const vendors = getAllVendors();
        console.log(`Found ${vendors.length} available vendors`);
    }

    /**
     * Evaluation: Use Gemini to score and rank vendors
     */
    private async evaluationPhase(workflowId: number) {
        console.log(`🤖 Evaluation phase for workflow ${workflowId}...`);

        const workflow = this.workflows.get(workflowId)!;
        const vendors = getAllVendors();

        const criteria: EvaluationCriteria = {
            maxBudget: workflow.request.maxBudget,
            minQualityScore: workflow.request.minQualityScore,
            preferredSLA: workflow.request.preferredSLA,
            durationDays: workflow.request.durationDays,
        };

        // Gemini evaluation
        const evaluation = await this.geminiEvaluator.evaluateVendors(
            workflow.request.brief,
            vendors,
            criteria
        );

        // Validate decision
        const constraints: DecisionConstraints = {
            maxBudget: workflow.request.maxBudget,
            minQualityScore: workflow.request.minQualityScore,
            preferredSLA: workflow.request.preferredSLA,
        };

        const validation = this.decisionValidator.validate(
            evaluation.rankedVendors,
            constraints
        );

        if (!validation.isValid) {
            throw new Error(
                `No valid vendors found: ${validation.violations.join(", ")}`
            );
        }

        // Store decision hash on-chain
        await this.blockchainService.startEvaluation(
            workflowId,
            validation.decisionHash
        );

        this.updateWorkflowState(workflowId, AgentState.Evaluation, {
            evaluation,
            selectedVendorId: validation.selectedVendor!.vendorId,
        });

        console.log(`✅ Selected vendor: ${validation.selectedVendor!.vendorName}`);
    }

    /**
     * Selection: Finalize vendor selection
     */
    private async selectionPhase(workflowId: number) {
        console.log(`✔️ Selection phase for workflow ${workflowId}...`);

        const workflow = this.workflows.get(workflowId)!;
        const vendor = getVendorById(workflow.selectedVendorId!);

        if (!vendor) {
            throw new Error("Selected vendor not found");
        }

        // Calculate payment amount
        const paymentAmount =
            (vendor.pricePerMonth * workflow.request.durationDays) / 30;

        await this.blockchainService.selectVendor(
            workflowId,
            vendor.id,
            paymentAmount
        );

        this.updateWorkflowState(workflowId, AgentState.Selection);
    }

    /**
     * Payment: Execute payment via x402
     */
    private async paymentPhase(workflowId: number) {
        console.log(`💰 Payment phase for workflow ${workflowId}...`);

        const workflow = this.workflows.get(workflowId)!;
        const vendor = getVendorById(workflow.selectedVendorId!);

        if (!vendor) {
            throw new Error("Selected vendor not found");
        }

        const paymentAmount =
            (vendor.pricePerMonth * workflow.request.durationDays) / 30;

        // In production, this would be a real vendor wallet address
        const vendorAddress = "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0"; // Mock address

        const txHash = await this.blockchainService.executePayment(
            workflowId,
            vendorAddress,
            paymentAmount
        );

        this.updateWorkflowState(workflowId, AgentState.PaymentPending, {
            paymentTxHash: txHash,
        });

        console.log(`✅ Payment executed: ${txHash}`);
    }

    /**
     * Settlement: Finalize via AP2
     */
    private async settlementPhase(workflowId: number) {
        console.log(`🔒 Settlement phase for workflow ${workflowId}...`);

        const workflow = this.workflows.get(workflowId)!;
        const vendor = getVendorById(workflow.selectedVendorId!);

        if (!vendor) {
            throw new Error("Selected vendor not found");
        }

        const paymentAmount =
            (vendor.pricePerMonth * workflow.request.durationDays) / 30;

        await this.blockchainService.finalizeSettlement(
            workflowId,
            workflow.paymentTxHash!,
            paymentAmount
        );

        this.updateWorkflowState(workflowId, AgentState.Settled);

        console.log(`✅ Settlement finalized`);
    }

    /**
     * Completion: Mark workflow as complete
     */
    private async completionPhase(workflowId: number) {
        console.log(`✨ Completion phase for workflow ${workflowId}...`);

        await this.blockchainService.completeWorkflow(workflowId);

        this.updateWorkflowState(workflowId, AgentState.Completed);
    }

    /**
     * Get workflow status
     */
    getWorkflowStatus(workflowId: number): WorkflowData | undefined {
        return this.workflows.get(workflowId);
    }

    /**
     * Update workflow state
     */
    private updateWorkflowState(
        workflowId: number,
        state: AgentState,
        updates: Partial<WorkflowData> = {}
    ) {
        const workflow = this.workflows.get(workflowId);
        if (workflow) {
            this.workflows.set(workflowId, {
                ...workflow,
                ...updates,
                state,
            });
        }
    }
}
