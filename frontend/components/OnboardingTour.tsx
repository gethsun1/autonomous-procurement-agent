"use client";

import { useState, useEffect } from "react";
import Joyride, { CallBackProps, STATUS, Step } from "react-joyride";
import { motion, AnimatePresence } from "framer-motion";
import { Rocket, Play, X, BookOpen } from "lucide-react";

export default function OnboardingTour() {
    const [run, setRun] = useState(false);
    const [showWelcomeModal, setShowWelcomeModal] = useState(false);
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
        const tourCompleted = localStorage.getItem("apa_tour_completed");
        if (!tourCompleted) {
            // Slight delay so the UI can settle
            const timer = setTimeout(() => setShowWelcomeModal(true), 1500);
            return () => clearTimeout(timer);
        }
    }, []);

    const handleJoyrideCallback = (data: CallBackProps) => {
        const { status } = data;
        const finishedStatuses: string[] = [STATUS.FINISHED, STATUS.SKIPPED];

        if (finishedStatuses.includes(status)) {
            setRun(false);
            localStorage.setItem("apa_tour_completed", "true");
        }
    };

    const startTour = () => {
        setShowWelcomeModal(false);
        setRun(true);
    };

    const skipTour = () => {
        setShowWelcomeModal(false);
        localStorage.setItem("apa_tour_completed", "true");
    };

    // Export a function globally or via context so user can re-trigger it from "Help" section if needed.
    // However, the simplest way is to expose it on the window object for simplicity.
    useEffect(() => {
        if (typeof window !== "undefined") {
            (window as any).startAutonomousTour = () => {
                setRun(true);
            };
        }
    }, []);

    const steps: Step[] = [
        {
            target: "body",
            content: (
                <div className="space-y-2 text-left">
                    <h3 className="text-sm font-bold text-white uppercase tracking-widest flex items-center gap-2">
                        <Rocket className="w-4 h-4 text-[var(--kinetic-teal)]" />
                        Command Bridge
                    </h3>
                    <p className="text-[11px] font-mono text-slate-300 leading-relaxed">
                        Welcome to the Autonomous Procurement Agent. This dashboard gives you total oversight over the AI's autonomous purchasing decisions and blockchain settlements.
                    </p>
                </div>
            ),
            placement: "center",
            disableBeacon: true,
        },
        {
            target: ".tour-wallet-manager",
            content: (
                <div className="space-y-2 text-left">
                    <h3 className="text-sm font-bold text-[var(--cyber-lime)] uppercase tracking-widest">Test Wallet Manager</h3>
                    <p className="text-[11px] font-mono text-slate-300">
                        First, use the Test Wallet Manager to connect your Web3 wallet, get free gas (sFUEL), and mint custom Test USDC to fund the AI's agentic procurements.
                    </p>
                </div>
            ),
        },
        {
            target: ".tour-workflow-control",
            content: (
                <div className="space-y-2 text-left">
                    <h3 className="text-sm font-bold text-yellow-500 uppercase tracking-widest">Provide Intent</h3>
                    <p className="text-[11px] font-mono text-slate-300">
                        Specify exactly what you need procured. Define your constraints like Max Budget, Quality cutoff, and Service Level Agreements (SLA). The agent respects these constraints strictly.
                    </p>
                </div>
            ),
        },
        {
            target: ".tour-agent-ops",
            content: (
                <div className="space-y-2 text-left">
                    <h3 className="text-sm font-bold text-[var(--kinetic-teal)] uppercase tracking-widest">Execution Pipeline</h3>
                    <p className="text-[11px] font-mono text-slate-300">
                        Watch the AI agent flow through Discovery, Evaluation, and Selection before prompting you for Escrow Payment execution and final Settlement.
                    </p>
                </div>
            ),
        },
        {
            target: ".tour-event-log",
            content: (
                <div className="space-y-2 text-left">
                    <h3 className="text-sm font-bold text-white uppercase tracking-widest">Deep Transparency</h3>
                    <p className="text-[11px] font-mono text-slate-300">
                        Every system state change, AI reasoning step, and on-chain contract interaction safely streams here to guarantee total operational transparency.
                    </p>
                </div>
            ),
        }
    ];

    if (!isMounted) return null;

    return (
        <>
            <Joyride
                steps={steps}
                run={run}
                continuous={true}
                showSkipButton={true}
                showProgress={true}
                callback={handleJoyrideCallback}
                styles={{
                    options: {
                        arrowColor: "#121821",
                        backgroundColor: "#121821",
                        overlayColor: "rgba(0, 0, 0, 0.75)",
                        primaryColor: "var(--kinetic-teal)",
                        textColor: "#FFF",
                        zIndex: 1000,
                    },
                    tooltipContainer: {
                        textAlign: "left",
                    },
                    buttonBack: {
                        color: "#94a3b8",
                        marginRight: 10,
                        fontFamily: "monospace",
                        textTransform: "uppercase",
                        fontSize: "10px",
                        letterSpacing: "0.1em",
                    },
                    buttonNext: {
                        backgroundColor: "var(--kinetic-teal)",
                        color: "#000",
                        fontWeight: "bold",
                        fontFamily: "monospace",
                        textTransform: "uppercase",
                        fontSize: "10px",
                        letterSpacing: "0.1em",
                        borderRadius: "4px",
                    },
                    buttonSkip: {
                        color: "#ef4444",
                        fontFamily: "monospace",
                        textTransform: "uppercase",
                        fontSize: "10px",
                        letterSpacing: "0.1em",
                    },
                    tooltip: {
                        border: "1px solid rgba(255, 255, 255, 0.1)",
                        borderRadius: "8px",
                        boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)",
                    },
                    tooltipFooter: {
                        marginTop: "16px",
                    }
                }}
            />

            <AnimatePresence>
                {showWelcomeModal && (
                    <div className="fixed inset-0 z-[1001] flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-md">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 10 }}
                            transition={{ duration: 0.3, ease: "easeOut" }}
                            className="w-full max-w-lg bg-[#0B0F14] border border-[var(--kinetic-teal)]/30 rounded-2xl shadow-[0_0_50px_rgba(0,212,255,0.15)] overflow-hidden relative"
                        >
                            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[var(--kinetic-teal)] via-[var(--cyber-lime)] to-[var(--kinetic-teal)]" />

                            <div className="p-8">
                                <div className="flex items-center justify-center w-16 h-16 rounded-full bg-[var(--kinetic-teal)]/10 border border-[var(--kinetic-teal)]/20 mb-6 mx-auto shadow-inner">
                                    <Rocket className="w-8 h-8 text-[var(--kinetic-teal)]" />
                                </div>

                                <h2 className="text-2xl font-bold text-center text-white tracking-tight mb-4">
                                    Welcome to the Future of Procurement
                                </h2>

                                <p className="text-slate-300 text-center font-mono text-xs leading-relaxed mb-8">
                                    The Autonomous Procurement Agent platform bridges the gap between AI-driven decision making and verifiable on-chain settlements. Take a quick interactive tour to understand how to operate the command bridge.
                                </p>

                                <div className="flex flex-col gap-3">
                                    <button
                                        onClick={startTour}
                                        className="w-full py-3.5 bg-[var(--kinetic-teal)] hover:bg-[#00e5ff] text-black rounded-lg text-xs font-mono font-bold uppercase tracking-widest transition-all shadow-[0_0_15px_rgba(0,212,255,0.3)] flex justify-center items-center gap-2"
                                    >
                                        <Play className="w-4 h-4" />
                                        Start Interactive Tour
                                    </button>

                                    <button
                                        onClick={skipTour}
                                        className="w-full py-3.5 bg-white/5 hover:bg-white/10 text-slate-300 rounded-lg text-xs font-mono font-bold uppercase tracking-widest transition-colors flex justify-center items-center gap-2 border border-white/10"
                                    >
                                        <X className="w-4 h-4" />
                                        Skip Tour
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </>
    );
}
