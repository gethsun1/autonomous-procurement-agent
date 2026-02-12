"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    ClipboardList,
    Search,
    Brain,
    Target,
    CreditCard,
    Handshake,
    CheckCircle2,
    Activity
} from "lucide-react";

export interface Props {
    currentState: string;
}

const STEPS = [
    { id: "Initialized", label: "Request Initialized", icon: ClipboardList },
    { id: "Discovery", label: "Vendor Discovery", icon: Search },
    { id: "Evaluation", label: "Gemini AI Evaluation", icon: Brain },
    { id: "Selection", label: "Vendor Selection", icon: Target },
    { id: "PaymentPending", label: "Executing Payment", icon: CreditCard },
    { id: "Settled", label: "Final Settlement", icon: Handshake },
    { id: "Completed", label: "Procurement Complete", icon: CheckCircle2 },
];

export default function AgentActivityPanel({ currentState }: Props) {
    const currentIndex = STEPS.findIndex((s) => s.id === currentState);
    const activeIndex = currentIndex === -1 ? 0 : currentIndex;

    return (
        <div className="h-full glass rounded-3xl p-10 border border-white/10 flex flex-col shadow-2xl relative group overflow-hidden">
            {/* Top Shine */}
            <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-[var(--kinetic-teal)] to-transparent opacity-20" />

            <div className="mb-16 flex items-center justify-between relative z-10 w-full">
                <div className="flex flex-col gap-1">
                    <h3 className="text-3xl font-black font-display text-white tracking-tight uppercase">
                        Agent Live Feed
                    </h3>
                    <div className="px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs font-mono text-slate-500 tracking-[0.3em] font-bold w-fit uppercase">
                        V3.0_STREAM
                    </div>
                </div>
                <div className="p-4 rounded-2xl bg-[var(--kinetic-teal)]/10 border border-[var(--kinetic-teal)]/20 text-[var(--kinetic-teal)] shadow-[0_0_25px_rgba(0,255,255,0.2)]">
                    <Activity className="w-8 h-8 animate-pulse" />
                </div>
            </div>

            <div className="relative space-y-14 custom-scrollbar pr-2">
                {/* Visual Connector Line - Removed to prevent overlap issues in new layout */}
                <div className="absolute left-[29px] top-5 bottom-5 w-[1px] bg-gradient-to-b from-[var(--kinetic-teal)]/20 via-white/5 to-transparent" />

                {STEPS.map((step, index) => {
                    const isActive = index === activeIndex;
                    const isCompleted = index < activeIndex;
                    const Icon = step.icon;

                    return (
                        <motion.div
                            key={step.id}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{
                                opacity: isActive ? 1 : isCompleted ? 0.7 : 0.4,
                                x: 0
                            }}
                            className="relative flex items-start gap-4 group/step text-left"
                        >
                            {/* Icon Container (Relative Flow) */}
                            <div className={`
                                w-10 h-10 flex-shrink-0 rounded-xl flex items-center justify-center border transition-all duration-500 z-10
                                ${isActive
                                    ? 'bg-[var(--kinetic-teal)] border-[var(--kinetic-teal)] text-white shadow-[0_0_20px_rgba(45,212,191,0.4)] scale-110'
                                    : isCompleted
                                        ? 'bg-[#10b981]/10 border-[#10b981]/30 text-[#10b981]'
                                        : 'bg-white/5 border-white/10 text-slate-500'}
                            `}>
                                <Icon className={`w-5 h-5 ${isActive ? 'animate-bounce' : ''}`} />

                                {isActive && (
                                    <motion.div
                                        layoutId="active-ring"
                                        className="absolute -inset-1 border border-[var(--kinetic-teal)] rounded-xl opacity-50"
                                        animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.2, 0.5] }}
                                        transition={{ duration: 2, repeat: Infinity }}
                                    />
                                )}
                            </div>

                            {/* Text Content */}
                            <div className="pt-1 flex-1 min-w-0">
                                <h4 className={`text-base font-semibold transition-colors duration-300 break-words ${isActive ? 'text-[var(--kinetic-teal)]' : isCompleted ? 'text-[#10b981]' : 'text-slate-500'
                                    }`}>
                                    {step.label}
                                </h4>
                                <AnimatePresence mode="wait">
                                    {isActive && (
                                        <motion.div
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{ opacity: 1, height: 'auto' }}
                                            exit={{ opacity: 0, height: 0 }}
                                            className="overflow-hidden"
                                        >
                                            <p className="text-sm text-slate-400 mt-1 font-mono flex items-center gap-2 flex-wrap">
                                                <span className="w-1.5 h-1.5 flex-shrink-0 rounded-full bg-[var(--kinetic-teal)] animate-ping" />
                                                Processing..
                                            </p>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                                {isCompleted && (
                                    <p className="text-xs text-[#10b981]/60 mt-1 font-mono italic">
                                        Success
                                    </p>
                                )}
                            </div>
                        </motion.div>
                    );
                })}
            </div>

            {/* Bottom Status Panel */}
            <div className="mt-16 pt-12 border-t border-white/5 relative z-10 font-mono text-[10px] space-y-6">
                <div className="flex justify-between items-center bg-white/5 p-5 rounded-2xl border border-white/5 shadow-inner">
                    <span className="text-slate-500 uppercase tracking-[0.3em] font-black">Operation Status</span>
                    <span className="text-[var(--kinetic-teal)] font-black tracking-widest bg-[var(--kinetic-teal)]/10 px-4 py-1.5 rounded-xl border border-[var(--kinetic-teal)]/20 shadow-[0_0_15px_rgba(0,255,255,0.1)]">
                        {currentState.toUpperCase() || 'IDLE'}
                    </span>
                </div>
                <div className="flex justify-between items-center px-2 text-slate-500 font-bold uppercase tracking-widest">
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-[#10b981] animate-pulse" />
                        <span>TX GENESIS: OK</span>
                    </div>
                    <span>LATENCY: 12ms</span>
                </div>
                <div className="flex items-center gap-3 px-2 pt-2 border-t border-white/5">
                    <div className="w-1.5 h-1.5 rounded-full bg-[var(--kinetic-teal)]" />
                    <span className="text-xs text-slate-600 font-mono tracking-tighter uppercase">Protocol Layer: Active</span>
                </div>
            </div>
        </div>
    );
}
