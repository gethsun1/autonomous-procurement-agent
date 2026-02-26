import express from "express";
import cors from "cors";
import * as dotenv from "dotenv";
import { GeminiEvaluator } from "./agent/GeminiEvaluator";
import { DecisionValidator } from "./agent/DecisionValidator";
import { BlockchainService } from "./services/BlockchainService";
import { EncryptionService } from "./services/EncryptionService";
import { AgentOrchestrator, ProcurementRequest } from "./agent/AgentOrchestrator";
import { getAllVendors, getVendorById } from "./data/VendorData";
import * as fs from "fs";
import * as path from "path";

dotenv.config({ path: "../.env" });

// ─── Hard-fail on missing secrets ─────────────────────────────────────────────
// The system will not run in a degraded/fallback mode. Every required secret
// must be present in the environment or the process crashes with a clear message.
function requireEnv(name: string): string {
    const value = process.env[name];
    if (!value || value.trim() === "") {
        throw new Error(
            `\n❌ REQUIRED ENVIRONMENT VARIABLE MISSING: ${name}\n` +
            `   Copy .env.example to .env and set all required values.\n` +
            `   The system will not start without all secrets configured.\n`
        );
    }
    return value;
}

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Initialize services
let orchestrator: AgentOrchestrator;

async function initializeServices() {
    console.log("🔧 Initializing services...");

    // All three secrets are required — hard crash if missing
    const geminiApiKey = requireEnv("GEMINI_API_KEY");
    const privateKey = requireEnv("DEPLOYER_PRIVATE_KEY");
    const encKey = requireEnv("ENCRYPTION_KEY");

    const rpcUrl = process.env.SKALE_RPC_URL;
    if (!rpcUrl) {
        throw new Error(
            "SKALE_RPC_URL is not set. Set it to the SKALE Base Sepolia RPC endpoint."
        );
    }

    // Payment scale divisor — transparent, from env, default 1M for testnet demo
    const paymentScaleDivisor = parseInt(process.env.PAYMENT_SCALE_DIVISOR || "1000000", 10);
    console.log(`💱 Payment scale divisor: ${paymentScaleDivisor} (1 = production amounts)`);

    const geminiEvaluator = new GeminiEvaluator(geminiApiKey);
    const decisionValidator = new DecisionValidator();
    const encryptionService = new EncryptionService(encKey);

    const blockchainService = new BlockchainService(rpcUrl, privateKey, paymentScaleDivisor);

    // Load contract addresses from deployment
    try {
        const deploymentPath = path.join(
            __dirname,
            "../../contracts/deployments/latest.json"
        );

        if (fs.existsSync(deploymentPath)) {
            const deployment = JSON.parse(fs.readFileSync(deploymentPath, "utf8"));
            await blockchainService.initializeContracts(deployment.contracts);
            console.log("✅ Blockchain service initialized");
        } else {
            console.warn("⚠️ No deployment file found. Run: cd contracts && npm run deploy");
        }
    } catch (error) {
        console.error("Failed to initialize blockchain service:", error);
    }

    orchestrator = new AgentOrchestrator(
        geminiEvaluator,
        decisionValidator,
        blockchainService,
        encryptionService
    );

    console.log("✅ Services initialized");
}

// Routes
const apiRouter = express.Router();
app.use("/api", apiRouter);

/**
 * Get all available vendors
 */
apiRouter.get("/vendors", (req, res) => {
    const vendors = getAllVendors();
    res.json({ success: true, vendors });
});

/**
 * Get vendor by ID
 */
apiRouter.get("/vendors/:id", (req, res) => {
    const vendor = getVendorById(req.params.id);

    if (!vendor) {
        return res.status(404).json({ success: false, error: "Vendor not found" });
    }

    res.json({ success: true, vendor });
});

/**
 * Submit a procurement request
 */
apiRouter.post("/procurement/request", async (req, res) => {
    try {
        const request: ProcurementRequest = req.body;

        // Validate request
        if (!request.brief || !request.maxBudget) {
            return res.status(400).json({
                success: false,
                error: "Missing required fields: brief, maxBudget",
            });
        }

        // Set defaults
        request.minQualityScore = request.minQualityScore || 7.0;
        request.preferredSLA = request.preferredSLA || 99.0;
        request.durationDays = request.durationDays || 30;

        const workflowId = await orchestrator.initializeWorkflow(request);

        res.json({
            success: true,
            workflowId,
            message: "Procurement workflow initialized",
        });
    } catch (error) {
        console.error("Error creating procurement request:", error);
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : "Unknown error",
        });
    }
});

/**
 * Execute autonomous procurement flow
 */
apiRouter.post("/procurement/:workflowId/execute", async (req, res) => {
    try {
        const workflowId = parseInt(req.params.workflowId);

        // Start autonomous execution (non-blocking)
        orchestrator.executeAutonomousFlow(workflowId).catch((error) => {
            console.error(`Workflow ${workflowId} execution failed:`, error);
        });

        res.json({
            success: true,
            message: "Autonomous execution started",
            workflowId,
        });
    } catch (error) {
        console.error("Error starting execution:", error);
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : "Unknown error",
        });
    }
});

/**
 * Get workflow status — chain is authoritative source of truth (Phase 4)
 */
apiRouter.get("/procurement/:workflowId/status", async (req, res) => {
    try {
        const workflowId = parseInt(req.params.workflowId);

        // 1. Try to get authoritative state from blockchain
        const blockchainService = orchestrator.getBlockchainService();
        const chainState = await blockchainService.getFullWorkflowState(workflowId);

        // 2. Get in-memory data (evaluation object — not storable on-chain)
        const memoryData = orchestrator.getWorkflowStatus(workflowId);

        if (!chainState && !memoryData) {
            return res.status(404).json({
                success: false,
                error: "Workflow not found",
            });
        }

        // 3. Merge: chain state is authoritative for state/hashes; memory holds evaluation
        const merged = {
            workflowId,
            // Chain-authoritative fields
            state: chainState?.state ?? memoryData?.state ?? "Initialized",
            paymentTxHash: chainState?.paymentTxHash ?? memoryData?.paymentTxHash,
            paymentExecuted: chainState?.paymentExecuted ?? false,
            settlementFinalized: chainState?.settlementFinalized ?? false,
            paymentScaleDivisor: chainState?.paymentScaleDivisor ?? 1,
            // In-memory fields (AI evaluation, request params)
            request: memoryData?.request,
            evaluation: memoryData?.evaluation,
            evaluationMode: memoryData?.evaluationMode ?? memoryData?.evaluation?.evaluationMode,
            selectedVendorId: chainState?.selectedVendorId || memoryData?.selectedVendorId,
            error: memoryData?.error,
            // Source of truth indicator
            stateSource: chainState ? "chain" : "memory",
        };

        res.json({
            success: true,
            workflow: merged,
        });
    } catch (error) {
        console.error("Error getting workflow status:", error);
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : "Unknown error",
        });
    }
});

/**
 * Get evaluation results
 */
apiRouter.get("/procurement/:workflowId/evaluation", (req, res) => {
    try {
        const workflowId = parseInt(req.params.workflowId);
        const workflow = orchestrator.getWorkflowStatus(workflowId);

        if (!workflow) {
            return res.status(404).json({
                success: false,
                error: "Workflow not found",
            });
        }

        if (!workflow.evaluation) {
            return res.status(404).json({
                success: false,
                error: "Evaluation not yet complete",
            });
        }

        // Add vendor details to evaluation
        const rankedVendorsWithDetails = workflow.evaluation.rankedVendors.map(
            (score) => {
                const vendor = getVendorById(score.vendorId);
                return {
                    ...score,
                    vendor,
                };
            }
        );

        res.json({
            success: true,
            evaluation: {
                ...workflow.evaluation,
                rankedVendors: rankedVendorsWithDetails,
            },
        });
    } catch (error) {
        console.error("Error getting evaluation:", error);
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : "Unknown error",
        });
    }
});

/**
 * Health check
 */
app.get("/health", (req, res) => {
    res.json({
        success: true,
        status: "healthy",
        timestamp: new Date().toISOString(),
    });
});

// Start server
async function start() {
    try {
        await initializeServices();

        app.listen(PORT, () => {
            console.log(`\n🚀 Autonomous Procurement Agent API running on port ${PORT}`);
            console.log(`\n📡 Endpoints:`);
            console.log(`   GET  /health`);
            console.log(`   GET  /vendors`);
            console.log(`   POST /procurement/request`);
            console.log(`   POST /procurement/:workflowId/execute`);
            console.log(`   GET  /procurement/:workflowId/status`);
            console.log(`   GET  /procurement/:workflowId/evaluation`);
            console.log(`\n✨ Ready to process procurement requests!\n`);
        });
    } catch (error) {
        console.error("Failed to start server:", error);
        process.exit(1);
    }
}

start();
