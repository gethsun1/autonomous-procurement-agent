"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

// New Dashboard Components
import TopHeader from "@/components/TopHeader";
import SystemOverview from "@/components/SystemOverview";
import AgentOperationsPanel from "@/components/AgentOperationsPanel";
import WorkflowControlPanel, { DashboardProcurementData } from "@/components/WorkflowControlPanel";
import ActiveWorkflowsTable from "@/components/ActiveWorkflowsTable";
import WorkflowDetailView from "@/components/WorkflowDetailView";
import EventLogPanel from "@/components/EventLogPanel";
import EconomicActivity from "@/components/EconomicActivity";
import AgentRegistryPanel from "@/components/AgentRegistryPanel";
import TestWalletManager from "@/components/TestWalletManager";
import InsufficientFundsAlert from "@/components/InsufficientFundsAlert";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

interface WorkflowData {
  workflowId: number;
  state: string;
  request: any;
  evaluation?: any;
  selectedVendorId?: string;
  paymentTxHash?: string;
  settlementTxHash?: string;
  error?: string;
}

export default function Dashboard() {
  const [workflowId, setWorkflowId] = useState<number | null>(null);
  const [workflow, setWorkflow] = useState<WorkflowData | null>(null);
  const [loading, setLoading] = useState(false);
  const [polling, setPolling] = useState(false);

  // Poll for workflow updates
  useEffect(() => {
    if (!workflowId || !polling) return;

    const interval = setInterval(async () => {
      try {
        const response = await fetch(
          `${API_URL}/api/procurement/${workflowId}/status`
        );
        const data = await response.json();

        if (data.success) {
          setWorkflow(data.workflow);

          // Stop polling when completed or error
          if (
            data.workflow.state === "Completed" ||
            data.workflow.state === "Error"
          ) {
            setPolling(false);
          }

          // Fetch evaluation when available
          if (
            ["Evaluation", "Selection", "PaymentPending", "Settled", "Completed"].includes(data.workflow.state) && !workflow?.evaluation
          ) {
            fetchEvaluation(workflowId);
          }
        }
      } catch (error) {
        console.error("Error polling workflow:", error);
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [workflowId, polling, workflow?.evaluation]);

  const fetchEvaluation = async (id: number) => {
    try {
      const response = await fetch(`${API_URL}/api/procurement/${id}/evaluation`);
      const data = await response.json();

      if (data.success) {
        setWorkflow(prev => prev ? { ...prev, evaluation: data.evaluation } : prev);
      }
    } catch (error) {
      console.error("Error fetching evaluation:", error);
    }
  };

  const handleSubmitRequest = async (formData: DashboardProcurementData) => {
    setLoading(true);
    setWorkflow(null);
    setWorkflowId(null);

    try {
      const response = await fetch(`${API_URL}/api/procurement/request`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || "Failed to create workflow");
      }

      const newWorkflowId = data.workflowId;
      setWorkflowId(newWorkflowId);
      setWorkflow({
        workflowId: newWorkflowId,
        state: "Initialized",
        request: formData,
      });

      const executeResponse = await fetch(`${API_URL}/api/procurement/${newWorkflowId}/execute`, {
        method: "POST",
      });

      const executeData = await executeResponse.json();

      if (executeData.success) {
        setPolling(true);
      }
    } catch (error: any) {
      console.error("Error submitting request:", error);
      // Create a mock error workflow state to show the alert
      setWorkflow({
        workflowId: 999,
        state: "Error",
        request: formData,
        error: error.message
      });
    } finally {
      setLoading(false);
    }
  };

  // Generate timeline for detail view
  const generateTimeline = (currentState: string = "Initialized"): { title: string; time: string; status: "active" | "pending" | "completed" }[] => {
    const states = ["Initialized", "Discovery", "Evaluation", "PaymentPending", "Settled", "Completed"];
    const currentIndex = states.indexOf(currentState === "Error" ? "Initialized" : currentState);

    return [
      {
        title: "Workflow Initialized",
        time: "14:03:12",
        status: (currentIndex >= 0 ? (currentIndex > 0 ? 'completed' : 'active') : 'pending') as "active" | "pending" | "completed"
      },
      {
        title: "Vendor Discovery & Evaluation",
        time: currentIndex >= 2 ? "14:03:18" : "",
        status: (currentIndex >= 2 ? (currentIndex > 2 ? 'completed' : 'active') : 'pending') as "active" | "pending" | "completed"
      },
      {
        title: "Escrow Payment Executed",
        time: currentIndex >= 3 ? "14:03:25" : "",
        status: (currentIndex >= 3 ? (currentIndex > 3 ? 'completed' : 'active') : 'pending') as "active" | "pending" | "completed"
      },
      {
        title: "Settlement Verification",
        time: currentIndex >= 4 ? "14:03:26" : "",
        status: (currentIndex >= 4 ? (currentIndex > 4 ? 'completed' : 'active') : 'pending') as "active" | "pending" | "completed"
      }
    ];
  };

  return (
    <div className="min-h-screen bg-[var(--obsidian)] text-white font-sans flex flex-col pt-0 pb-12 relative z-10 selection:bg-[var(--kinetic-teal)] selection:text-black">

      {/* 1. Global Navigation */}
      <TopHeader />

      <main className="w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 pt-8 flex flex-col gap-8">

        {/* Row 1: System Overview & Test Wallet */}
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-6 items-stretch">
          <div className="xl:col-span-3">
            <SystemOverview />
          </div>
          <div className="xl:col-span-1 h-full font-mono text-xs text-white">
            {/* Replace or wrap with a dynamic height component if necessary */}
            <div className="h-full">
              <TestWalletManager />
            </div>
          </div>
        </div>

        {/* Row 2: Agent Operations & Event Log */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 items-stretch">
          <div className="xl:col-span-2">
            <AgentOperationsPanel currentState={workflow?.state || "Initialized"} />
          </div>
          <div className="xl:col-span-1 border border-white/5 rounded-xl h-full font-mono text-xs overflow-hidden flex flex-col bg-[#121821]">
            <EventLogPanel />
          </div>
        </div>

        {/* Row 3: Main Workflow Intelligence */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="xl:col-span-2 space-y-8 flex flex-col">

            {/* Control Panel / Actions */}
            <WorkflowControlPanel onSubmit={handleSubmitRequest} loading={loading} />

            {/* Error Notifications */}
            {workflow?.error && (
              <InsufficientFundsAlert
                error={workflow.error}
                walletAddress="0x075823CffDD46A492A971Cf98D57FB35A5912Ec9"
              />
            )}

            {/* Active Workflows Table or Detail View based on state */}
            <AnimatePresence mode="wait">
              {workflow && !workflow.error ? (
                <motion.div
                  key="detail"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                >
                  <WorkflowDetailView
                    workflowId={workflow.workflowId}
                    budget={workflow.request?.maxBudget || 100}
                    selectedVendor={workflow.evaluation?.rankedVendors?.find((v: any) => v.vendorId === workflow.selectedVendorId)?.vendor?.name || "Evaluating..."}
                    evaluationScore={workflow.evaluation?.rankedVendors?.[0]?.score ? Math.round(workflow.evaluation.rankedVendors[0].score * 10) : 0}
                    timeline={generateTimeline(workflow.state)}
                    escrowTx={workflow.paymentTxHash}
                    settlementTx={workflow.state === 'Completed' || workflow.state === 'Settled' ? '0xSAMPLE_SETTLEMENT_TX' : undefined}
                  />
                </motion.div>
              ) : (
                <motion.div
                  key="table"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <ActiveWorkflowsTable />
                </motion.div>
              )}
            </AnimatePresence>

          </div>

          <div className="xl:col-span-1 space-y-6 flex flex-col">
            <div className="h-64 shrink-0">
              <EconomicActivity />
            </div>
            <div className="h-64 shrink-0">
              <AgentRegistryPanel />
            </div>

            {/* If there's an active workflow and it's evaluated, show some vendor context or intelligence here if we want! 
                But EconomicActivity + Registry looks robust for the right-side vertical pillar. */}
          </div>
        </div>

      </main>

    </div>
  );
}
