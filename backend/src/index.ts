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

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Initialize services
let orchestrator: AgentOrchestrator;

async function initializeServices() {
    console.log("🔧 Initializing services...");

    const geminiApiKey = process.env.GEMINI_API_KEY;
    if (!geminiApiKey) {
        throw new Error("GEMINI_API_KEY not found in environment");
    }

    const rpcUrl = process.env.SKALE_RPC_URL;
    const privateKey = process.env.DEPLOYER_PRIVATE_KEY;

    if (!rpcUrl || !privateKey) {
        console.warn("⚠️ Blockchain credentials not configured. Running in mock mode.");
    }

    const geminiEvaluator = new GeminiEvaluator(geminiApiKey);
    const decisionValidator = new DecisionValidator();
    const encryptionService = new EncryptionService();

    // Initialize blockchain service if credentials available
    const blockchainService = new BlockchainService(
        rpcUrl || "http://localhost:8545",
        privateKey || "0x0000000000000000000000000000000000000000000000000000000000000001"
    );

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
            console.warn("⚠️ No deployment file found. Run contract deployment first.");
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

/**
 * Get all available vendors
 */
app.get("/vendors", (req, res) => {
    const vendors = getAllVendors();
    res.json({ success: true, vendors });
});

/**
 * Get vendor by ID
 */
app.get("/vendors/:id", (req, res) => {
    const vendor = getVendorById(req.params.id);

    if (!vendor) {
        return res.status(404).json({ success: false, error: "Vendor not found" });
    }

    res.json({ success: true, vendor });
});

/**
 * Submit a procurement request
 */
app.post("/procurement/request", async (req, res) => {
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
app.post("/procurement/:workflowId/execute", async (req, res) => {
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
 * Get workflow status
 */
app.get("/procurement/:workflowId/status", (req, res) => {
    try {
        const workflowId = parseInt(req.params.workflowId);
        const workflow = orchestrator.getWorkflowStatus(workflowId);

        if (!workflow) {
            return res.status(404).json({
                success: false,
                error: "Workflow not found",
            });
        }

        res.json({
            success: true,
            workflow,
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
app.get("/procurement/:workflowId/evaluation", (req, res) => {
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
