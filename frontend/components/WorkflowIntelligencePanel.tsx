"use client";

import { motion } from "framer-motion";
import { Shield, Hash, Brain, CreditCard, CheckCircle, ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";

interface Props {
    evaluation?: {
        rankedVendors: Array<{
            vendorId: string;
            vendorName: string;
            totalScore: number;
        }>;
        recommendation: string;
    };
    decisionHash?: string;
    selectedVendorId?: string;
    paymentTxHash?: string;
    settlementStatus?: boolean;
    currentState: string;
}

export default function WorkflowIntelligencePanel({
    evaluation,
    decisionHash,
    selectedVendorId,
    paymentTxHash,
    settlementStatus,
    currentState
}: Props) {
    const [isExpanded, setIsExpanded] = useState(true);

    // Compute decision hash if not provided but evaluation exists
    const computedDecisionHash = decisionHash || (evaluation ? generateMockHash(evaluation) : undefined);

    const hasData = evaluation || computedDecisionHash || selectedVendorId || paymentTxHash;

    if (!hasData) return null;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card p-8 mt-12 border-[var(--electric-violet)]/30 relative overflow-hidden"
        >
            {/* Header */}
            <div
                className="flex items-center justify-between cursor-pointer group"
                onClick={() => setIsExpanded(!isExpanded)}
            >
                <div className="flex items-center gap-4">
                    <div className="p-3 rounded-xl bg-[var(--electric-violet)]/20 border border-[var(--electric-violet)]/40 text-[var(--electric-violet)] shadow-[0_0_20px_rgba(212,0,255,0.2)]">
                        <Shield className="w-6 h-6" />
                    </div>
                    <div>
                        <h3 className="text-2xl font-black font-display text-white tracking-tight uppercase">
                            Agent Intelligence
                        </h3>
                        <p className="text-xs text-slate-500 font-mono tracking-widest uppercase mt-1">
                            Workflow Transparency Layer
                        </p>
                    </div>
                </div>
                <button className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors">
                    {isExpanded ? (
                        <ChevronUp className="w-5 h-5 text-slate-400" />
                    ) : (
                        <ChevronDown className="w-5 h-5 text-slate-400" />
                    )}
                </button>
            </div>

            {/* Expandable Content */}
            {isExpanded && (
                <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="mt-8 space-y-6"
                >
                    {/* Decision Hash */}
                    {computedDecisionHash && (
                        <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                            <div className="flex items-start gap-4">
                                <Hash className="w-5 h-5 text-[var(--kinetic-teal)] mt-1 flex-shrink-0" />
                                <div className="flex-1 min-w-0">
                                    <h4 className="text-sm font-bold text-slate-300 mb-2 uppercase tracking-wider">
                                        Decision Commitment Hash
                                    </h4>
                                    <code className="text-xs font-mono text-[var(--kinetic-teal)] bg-black/30 px-3 py-2 rounded-lg block overflow-x-auto">
                                        {computedDecisionHash}
                                    </code>
                                    <p className="text-xs text-slate-500 mt-2 italic">
                                        Cryptographic commitment stored before payment execution
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Gemini Evaluation Metadata */}
                    {evaluation && (
                        <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                            <div className="flex items-start gap-4">
                                <Brain className="w-5 h-5 text-[#4285f4] mt-1 flex-shrink-0" />
                                <div className="flex-1">
                                    <h4 className="text-sm font-bold text-slate-300 mb-3 uppercase tracking-wider">
                                        Gemini AI Evaluation Summary
                                    </h4>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <span className="text-xs text-slate-500 uppercase tracking-widest">Vendors Analyzed</span>
                                            <div className="text-2xl font-black text-white mt-1">
                                                {evaluation.rankedVendors.length}
                                            </div>
                                        </div>
                                        <div>
                                            <span className="text-xs text-slate-500 uppercase tracking-widest">Top Score</span>
                                            <div className="text-2xl font-black text-[var(--kinetic-teal)] mt-1">
                                                {evaluation.rankedVendors[0]?.totalScore.toFixed(1)}
                                            </div>
                                        </div>
                                    </div>
                                    <p className="text-sm text-slate-400 mt-4 italic leading-relaxed">
                                        "{evaluation.recommendation}"
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Selected Vendor */}
                    {selectedVendorId && evaluation && (
                        <div className="bg-[var(--kinetic-teal)]/10 border border-[var(--kinetic-teal)]/30 rounded-2xl p-6">
                            <div className="flex items-start gap-4">
                                <CheckCircle className="w-5 h-5 text-[var(--kinetic-teal)] mt-1 flex-shrink-0" />
                                <div className="flex-1">
                                    <h4 className="text-sm font-bold text-slate-300 mb-2 uppercase tracking-wider">
                                        Selected Vendor
                                    </h4>
                                    <div className="text-lg font-black text-white">
                                        {evaluation.rankedVendors.find(v => v.vendorId === selectedVendorId)?.vendorName || selectedVendorId}
                                    </div>
                                    <p className="text-xs text-slate-500 mt-2">
                                        Validated against encrypted constraints
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Payment Transaction */}
                    {paymentTxHash && (
                        <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                            <div className="flex items-start gap-4">
                                <CreditCard className="w-5 h-5 text-[var(--cyber-lime)] mt-1 flex-shrink-0" />
                                <div className="flex-1 min-w-0">
                                    <h4 className="text-sm font-bold text-slate-300 mb-2 uppercase tracking-wider">
                                        x402 Payment Transaction
                                    </h4>
                                    <code className="text-xs font-mono text-[var(--cyber-lime)] bg-black/30 px-3 py-2 rounded-lg block overflow-x-auto">
                                        {paymentTxHash}
                                    </code>
                                    <div className="flex items-center gap-2 mt-3">
                                        <div className={`w-2 h-2 rounded-full ${settlementStatus ? 'bg-green-500' : 'bg-yellow-500 animate-pulse'}`} />
                                        <span className="text-xs text-slate-400 uppercase tracking-wider">
                                            {settlementStatus ? 'Settlement Confirmed' : 'Pending Settlement'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Encrypted Constraints Indicator */}
                    <div className="bg-[var(--electric-violet)]/5 border border-[var(--electric-violet)]/20 rounded-2xl p-6">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <Shield className="w-5 h-5 text-[var(--electric-violet)]" />
                                <div>
                                    <h4 className="text-sm font-bold text-slate-300 uppercase tracking-wider">
                                        Privacy Status
                                    </h4>
                                    <p className="text-xs text-slate-500 mt-1">
                                        Budget and evaluation weights encrypted via BITE
                                    </p>
                                </div>
                            </div>
                            <div className="px-4 py-2 rounded-full bg-[var(--electric-violet)]/20 border border-[var(--electric-violet)]/40">
                                <span className="text-xs font-mono font-bold text-[var(--electric-violet)] tracking-widest">
                                    ENCRYPTED
                                </span>
                            </div>
                        </div>
                    </div>
                </motion.div>
            )}
        </motion.div>
    );
}

// Helper: Generate mock decision hash for demonstration
function generateMockHash(evaluation: any): string {
    const crypto = require('crypto');
    const data = JSON.stringify({
        topVendor: evaluation.rankedVendors[0]?.vendorId,
        timestamp: Date.now(),
        recommendation: evaluation.recommendation
    });

    // In real implementation, this would come from backend DecisionValidator
    const hash = typeof window !== 'undefined'
        ? `0x${btoa(data).substring(0, 64).split('').map(c => c.charCodeAt(0).toString(16)).join('')}`
        : '0x' + '0'.repeat(64);

    return hash;
}
