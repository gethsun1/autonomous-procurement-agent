"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, AlertCircle, RefreshCw } from "lucide-react";
import HeroSection from "@/components/HeroSection";
import ProcurementRequestForm, {
  ProcurementFormData,
} from "@/components/ProcurementRequestForm";
import AgentActivityPanel from "@/components/AgentActivityPanel";
import VendorEvaluation from "@/components/VendorEvaluation";
import PaymentTracker from "@/components/PaymentTracker";
import WorkflowIntelligencePanel from "@/components/WorkflowIntelligencePanel";
import AnimatedBorder from "@/components/AnimatedBorder";
import InsufficientFundsAlert from "@/components/InsufficientFundsAlert";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

interface WorkflowData {
  workflowId: number;
  state: string;
  request: ProcurementFormData;
  evaluation?: any;
  selectedVendorId?: string;
  paymentTxHash?: string;
  error?: string;
}

export default function Home() {
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
          `${API_URL}/procurement/${workflowId}/status`
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
            ["Evaluation", "Selection", "PaymentPending", "Settled", "Completed"].includes(data.workflow.state)
          ) {
            fetchEvaluation(workflowId);
          }
        }
      } catch (error) {
        console.error("Error polling workflow:", error);
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [workflowId, polling]);

  const fetchEvaluation = async (id: number) => {
    try {
      const response = await fetch(`${API_URL}/api/procurement/${id}/evaluation`);
      const data = await response.json();

      if (data.success && workflow) {
        setWorkflow({
          ...workflow,
          evaluation: data.evaluation,
        });
      }
    } catch (error) {
      console.error("Error fetching evaluation:", error);
    }
  };

  const handleSubmitRequest = async (formData: ProcurementFormData) => {
    setLoading(true);

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

      const executeResponse = await fetch(`${API_URL}/procurement/${newWorkflowId}/execute`, {
        method: "POST",
      });

      const executeData = await executeResponse.json();

      if (executeData.success) {
        setPolling(true);
      }
    } catch (error) {
      console.error("Error submitting request:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setWorkflowId(null);
    setWorkflow(null);
    setPolling(false);
  };

  return (
    <div className="min-h-screen pb-24 pt-12 px-4 md:px-8 flex flex-col items-center">
      <div className="w-full max-w-[1300px] flex flex-col items-center">
        <AnimatedBorder>
          <div className="p-8 md:p-18 lg:p-20 w-full flex flex-col items-center">
            {/* Header Section */}
            <div className="w-full flex justify-center">
              <HeroSection />
            </div>

            <main className="relative z-10 mt-20 lg:mt-32 w-full max-w-[1100px]">
              <div className="flex flex-col lg:flex-row gap-20 justify-center items-start">

                {/* Main Interaction Area */}
                <div className="w-full lg:w-[60%] order-2 lg:order-1 flex flex-col">
                  <AnimatePresence mode="wait">
                    {!workflowId ? (
                      <motion.div
                        key="form"
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.98 }}
                        className="w-full"
                      >
                        <ProcurementRequestForm
                          onSubmit={handleSubmitRequest}
                          loading={loading}
                        />
                      </motion.div>
                    ) : (
                      <motion.div
                        key="results"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="space-y-12 w-full"
                      >
                        {/* Control Bar */}
                        <div className="flex justify-between items-center bg-white/5 border border-white/5 p-5 rounded-2xl backdrop-blur-md">
                          <div className="flex items-center gap-4">
                            <div className="w-2.5 h-2.5 rounded-full bg-[var(--kinetic-teal)] animate-pulse shadow-[0_0_15px_var(--kinetic-teal)]" />
                            <h2 className="text-xs font-bold font-mono tracking-[0.2em] text-slate-400 uppercase">
                              Active Mission: 0x{workflowId}
                            </h2>
                          </div>
                          <button
                            onClick={handleReset}
                            disabled={polling && workflow?.state !== "Completed"}
                            className="flex items-center gap-2 text-[10px] font-bold font-mono text-slate-400 hover:text-[var(--kinetic-teal)] transition-all disabled:opacity-30 group uppercase tracking-widest"
                          >
                            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                            RESET_SESSION
                          </button>
                        </div>

                        {/* Error Notification */}
                        {workflow?.error && (
                          <InsufficientFundsAlert
                            error={workflow.error}
                            walletAddress="0x075823CffDD46A492A971Cf98D57FB35A5912Ec9"
                          />
                        )}

                        {/* Marketplace Intelligence */}
                        {workflow?.evaluation && (
                          <VendorEvaluation
                            evaluation={workflow.evaluation}
                            selectedVendorId={workflow.selectedVendorId}
                          />
                        )}

                        {/* On-Chain Verification */}
                        {workflow?.state && ["PaymentPending", "Settled", "Completed"].includes(workflow.state) && (
                          <PaymentTracker
                            paymentTxHash={workflow.paymentTxHash}
                            settlementStatus={["Settled", "Completed"].includes(workflow.state)}
                            isCompleted={workflow.state === "Completed"}
                          />
                        )}

                        {/* Workflow Intelligence Panel */}
                        <WorkflowIntelligencePanel
                          evaluation={workflow?.evaluation}
                          selectedVendorId={workflow?.selectedVendorId}
                          paymentTxHash={workflow?.paymentTxHash}
                          settlementStatus={workflow?.state ? ["Settled", "Completed"].includes(workflow.state) : false}
                          currentState={workflow?.state || "Initialized"}
                        />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Transparency Sidebar */}
                <aside className="w-full lg:w-[40%] lg:sticky lg:top-16 order-1 lg:order-2 flex flex-col">
                  <AgentActivityPanel currentState={workflow?.state || (loading ? "Initialized" : "Initialized")} />

                  {/* Network Status Widget */}
                  <div className="mt-12 glass rounded-3xl p-6 border border-white/5 flex items-center justify-between shadow-2xl">
                    <div className="flex items-center gap-4">
                      <RefreshCw className="w-4 h-4 text-slate-500 animate-spin-slow" />
                      <span className="text-xs font-mono text-slate-400 tracking-[0.2em] font-bold">NODE_TX_STATUS: ACTIVE</span>
                    </div>
                    <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-[var(--cyber-lime)]/10 border border-[var(--cyber-lime)]/20 shadow-[0_0_15px_rgba(162,255,0,0.1)]">
                      <div className="w-1.5 h-1.5 rounded-full bg-[var(--cyber-lime)] animate-pulse" />
                      <span className="text-xs font-mono font-bold text-[var(--cyber-lime)] tracking-widest">STABLE</span>
                    </div>
                  </div>
                </aside>

              </div>
            </main>


            {/* Platform Footer - Scrolling Marquee */}
            <footer className="mt-40 pb-6 pt-20 border-t border-white/5 text-center relative z-10 w-full overflow-hidden">
              <div className="flex animate-scroll-left">
                {/* First set of content */}
                <div className="flex items-center justify-center gap-12 px-10 shrink-0">
                  <p className="text-xs font-mono text-slate-600 tracking-[0.5em] uppercase font-black pb-1 leading-relaxed whitespace-nowrap">
                    Autonomous Procurement POC v4.2.0 • 2026
                  </p>
                  <div className="flex items-center gap-12">
                    {["Protocol", "Security", "Analytics"].map((item) => (
                      <span key={item} className="text-xs font-mono text-slate-500 hover:text-[var(--kinetic-teal)] cursor-help transition-all uppercase tracking-[0.2em] font-bold pb-1 leading-relaxed whitespace-nowrap">
                        {item}
                      </span>
                    ))}
                  </div>
                </div>
                {/* Duplicate for seamless loop */}
                <div className="flex items-center justify-center gap-12 px-10 shrink-0">
                  <p className="text-xs font-mono text-slate-600 tracking-[0.5em] uppercase font-black pb-1 leading-relaxed whitespace-nowrap">
                    Autonomous Procurement POC v4.2.0 • 2026
                  </p>
                  <div className="flex items-center gap-12">
                    {["Protocol", "Security", "Analytics"].map((item) => (
                      <span key={`${item}-dup`} className="text-xs font-mono text-slate-500 hover:text-[var(--kinetic-teal)] cursor-help transition-all uppercase tracking-[0.2em] font-bold pb-1 leading-relaxed whitespace-nowrap">
                        {item}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </footer>
          </div>
        </AnimatedBorder>
      </div>
    </div>
  );
}
