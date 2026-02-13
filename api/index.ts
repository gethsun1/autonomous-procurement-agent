/**
 * Vercel Serverless API Entry Point
 * 
 * This file wraps the Express backend to run on Vercel's serverless infrastructure.
 * All existing routes are preserved and accessible at /api/*
 */

import express from "express";
import cors from "cors";
import * as dotenv from "dotenv";
import { GeminiEvaluator } from "../backend/src/agent/GeminiEvaluator";
import { DecisionValidator } from "../backend/src/agent/DecisionValidator";
import { BlockchainService } from "../backend/src/services/BlockchainService";
import { EncryptionService } from "../backend/src/services/EncryptionService";
import { AgentOrchestrator, ProcurementRequest } from "../backend/src/agent/AgentOrchestrator";
import { getAllVendors, getVendorById } from "../backend/src/data/VendorData";

// Load environment variables
dotenv.config();

const app = express();

// Middleware
app.use(cors({
    origin: [
        'http://localhost:3000',
        'https://autonomous-procurement-agent.vercel.app',
        'https://autonomous-procurement-agent-git-main-gethsun1s-projects.vercel.app',
        /https:\/\/.*\.vercel\.app$/
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// Initialize services (singleton pattern for serverless)
let orchestrator: AgentOrchestrator | null = null;

async function getOrchestrator(): Promise<AgentOrchestrator> {
    if (orchestrator) {
        return orchestrator;
    }

    console.log("🔧 Initializing services...");

    const geminiApiKey = process.env.GEMINI_API_KEY;
    if (!geminiApiKey) {
        console.warn("⚠️ GEMINI_API_KEY not found, using fallback evaluation");
    }

    const rpcUrl = process.env.SKALE_RPC_URL;
    const privateKey = process.env.DEPLOYER_PRIVATE_KEY;

    if (!rpcUrl || !privateKey) {
        console.warn("⚠️ Blockchain credentials not configured. Running in mock mode.");
    }

    const geminiEvaluator = new GeminiEvaluator(geminiApiKey || "");
    const decisionValidator = new DecisionValidator();
    const encryptionService = new EncryptionService();

    // Initialize blockchain service
    const blockchainService = new BlockchainService(
        rpcUrl || "http://localhost:8545",
        privateKey || "0x0000000000000000000000000000000000000000000000000000000000000001"
    );

    // Load contract addresses from environment
    try {
        const contracts = {
            ProcurementWorkflow: process.env.PROCUREMENT_WORKFLOW_ADDRESS || "",
            MockX402: process.env.X402_ADDRESS || "",
            MockAP2: process.env.AP2_ADDRESS || "",
            EncryptionHelper: process.env.ENCRYPTION_HELPER_ADDRESS || ""
        };

        if (contracts.ProcurementWorkflow && contracts.MockX402 && contracts.MockAP2) {
            await blockchainService.initializeContracts(contracts);
            console.log("✅ Blockchain service initialized");
        } else {
            console.warn("⚠️ Contract addresses not configured");
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
    return orchestrator;
}

// Routes

app.get("/api/health", (req, res) => {
    res.json({
        success: true,
        status: "healthy",
        timestamp: new Date().toISOString(),
        environment: "vercel-serverless"
    });
});

app.get("/api/vendors", (req, res) => {
    const vendors = getAllVendors();
    res.json({ success: true, vendors });
});

app.get("/api/vendors/:id", (req, res) => {
    const vendor = getVendorById(req.params.id);

    if (!vendor) {
        return res.status(404).json({ success: false, error: "Vendor not found" });
    }

    res.json({ success: true, vendor });
});

app.post("/api/procurement/request", async (req, res) => {
    try {
        const request: ProcurementRequest = req.body;

        if (!request.brief || !request.maxBudget) {
            return res.status(400).json({
                success: false,
                error: "Missing required fields: brief, maxBudget",
            });
        }

        request.minQualityScore = request.minQualityScore || 7.0;
        request.preferredSLA = request.preferredSLA || 99.0;
        request.durationDays = request.durationDays || 30;

        const orch = await getOrchestrator();
        const workflowId = await orch.initializeWorkflow(request);

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

app.post("/api/procurement/:workflowId/execute", async (req, res) => {
    try {
        const workflowId = parseInt(req.params.workflowId);
        const orch = await getOrchestrator();

        // Start autonomous execution (non-blocking)
        orch.executeAutonomousFlow(workflowId).catch((error) => {
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

app.get("/api/procurement/:workflowId/status", async (req, res) => {
    try {
        const workflowId = parseInt(req.params.workflowId);
        const orch = await getOrchestrator();
        
        // First try in-memory storage (same request cycle)
        let workflow = orch.getWorkflowStatus(workflowId);

        // If not in memory, fetch from blockchain (serverless fallback)
        if (!workflow) {
            const blockchainWorkflow = await orch.getBlockchainService().getWorkflowFromBlockchain(workflowId);
            
            if (!blockchainWorkflow) {
                return res.status(404).json({
                    success: false,
                    error: "Workflow not found",
                });
            }

            // Convert blockchain format to workflow format
            workflow = {
                workflowId: blockchainWorkflow.workflowId,
                state: blockchainWorkflow.state as any,
                request: {
                    brief: blockchainWorkflow.procurementBrief,
                    maxBudget: 0, // Not stored on-chain
                    minQualityScore: 0,
                    preferredSLA: 0,
                    durationDays: 0
                },
                selectedVendorId: blockchainWorkflow.selectedVendorId,
                paymentTxHash: blockchainWorkflow.paymentTxHash
            };
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

app.get("/api/procurement/:workflowId/evaluation", async (req, res) => {
    try {
        const workflowId = parseInt(req.params.workflowId);
        const orch = await getOrchestrator();
        const workflow = orch.getWorkflowStatus(workflowId);

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

// Root endpoint redirect
app.get("/api", (req, res) => {
    res.json({
        success: true,
        message: "Autonomous Procurement Agent API",
        version: "1.0.0",
        endpoints: [
            "GET /api/health",
            "GET /api/vendors",
            "GET /api/vendors/:id",
            "POST /api/procurement/request",
            "POST /api/procurement/:workflowId/execute",
            "GET /api/procurement/:workflowId/status",
            "GET /api/procurement/:workflowId/evaluation"
        ]
    });
});

// Export for Vercel serverless
export default app;
