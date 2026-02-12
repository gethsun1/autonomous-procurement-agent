"use client";

import { motion } from "framer-motion";
import { Sparkles, Trophy, CheckCircle2, XCircle, Info, ExternalLink, Zap } from "lucide-react";

interface VendorScore {
    vendorId: string;
    vendorName: string;
    totalScore: number;
    costScore: number;
    qualityScore: number;
    slaScore: number;
    reasoning: string;
    meetsConstraints: boolean;
    vendor?: {
        pricePerMonth: number;
        sla: number;
        reputationScore: number;
        features: string[];
        description: string;
    };
}

interface Props {
    evaluation?: {
        rankedVendors: VendorScore[];
        recommendation: string;
    };
    selectedVendorId?: string;
}

export default function VendorEvaluation({ evaluation, selectedVendorId }: Props) {
    if (!evaluation) {
        return (
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="glass rounded-3xl p-12 text-center border border-white/5"
            >
                <div className="relative inline-block mb-6">
                    <div className="absolute inset-0 bg-[var(--kinetic-teal)]/20 blur-2xl rounded-full animate-pulse" />
                    <Zap className="w-12 h-12 text-[var(--kinetic-teal)] relative z-10 mx-auto" />
                </div>
                <p className="text-slate-500 font-mono text-base tracking-widest uppercase">
                    Synthesizing Market Intelligence...
                </p>
            </motion.div>
        );
    }

    const { rankedVendors, recommendation } = evaluation;

    return (
        <div className="space-y-10">
            {/* AI Recommendation Spotlight */}
            <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass rounded-[2rem] p-10 border border-[var(--kinetic-teal)]/30 bg-gradient-to-br from-[var(--kinetic-teal)]/10 via-black/40 to-transparent relative overflow-hidden shadow-[0_0_50px_rgba(0,255,255,0.1)]"
            >
                <div className="absolute -top-12 -right-12 p-4 opacity-10">
                    <Sparkles className="w-32 h-32 text-[var(--kinetic-teal)] animate-pulse" />
                </div>

                <div className="flex gap-6 relative z-10">
                    <div className="p-4 rounded-2xl bg-[var(--kinetic-teal)]/20 text-[var(--kinetic-teal)] shadow-[0_0_20px_rgba(0,255,255,0.3)]">
                        <Sparkles className="w-8 h-8" />
                    </div>
                    <div>
                        <h3 className="text-2xl font-black text-white mb-3 font-display tracking-tight uppercase">
                            Strategic Recommendation
                        </h3>
                        <p className="text-slate-300 text-base leading-relaxed max-w-3xl font-light">
                            {recommendation}
                        </p>
                    </div>
                </div>
            </motion.div>

            {/* Vendor Scores Grid */}
            <div className="space-y-8">
                <div className="flex items-center justify-between px-4">
                    <h2 className="text-3xl font-black font-display text-white tracking-tighter uppercase">
                        Market Evaluation
                    </h2>
                    <div className="text-xs font-mono text-[var(--kinetic-teal)] tracking-widest bg-white/5 px-4 py-1.5 rounded-full border border-[var(--kinetic-teal)]/20 font-bold">
                        ALGORITHM: GEMINI_FLASH_1.5_PRO
                    </div>
                </div>

                <div className="grid gap-8">
                    {rankedVendors.map((score, index) => {
                        const isSelected = score.vendorId === selectedVendorId;
                        const isWinner = index === 0;

                        return (
                            <motion.div
                                key={score.vendorId}
                                initial={{ opacity: 0, x: -30 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: index * 0.12 }}
                                className={`glass rounded-[2rem] p-10 border transition-all duration-700 relative group overflow-hidden ${isSelected
                                    ? "border-[var(--kinetic-teal)] bg-[var(--kinetic-teal)]/10 shadow-[0_0_60px_rgba(0,255,255,0.2)]"
                                    : "border-white/10 hover:border-[var(--kinetic-teal)]/40 hover:bg-white/[0.02]"
                                    }`}
                            >
                                {isWinner && (
                                    <div className="absolute top-0 right-0 p-10 rotate-[15deg] opacity-10 scale-[1.8] group-hover:rotate-[10deg] group-hover:scale-[1.9] transition-all duration-1000">
                                        <Trophy className="w-32 h-32 text-[var(--kinetic-teal)] drop-shadow-[0_0_20px_var(--kinetic-teal)]" />
                                    </div>
                                )}

                                <div className="flex flex-col lg:flex-row items-start gap-10 relative z-10">
                                    {/* Rank & Identity */}
                                    <div className="flex lg:flex-col items-center gap-6">
                                        <div className={`w-16 h-16 rounded-3xl flex items-center justify-center font-black font-display text-2xl border-4 transition-all duration-700 ${isWinner
                                            ? "bg-[var(--kinetic-teal)] border-[var(--kinetic-teal)] text-[var(--obsidian)] shadow-[0_0_30px_rgba(0,255,255,0.6)]"
                                            : "bg-white/5 border-white/10 text-slate-500"
                                            }`}>
                                            {index + 1 < 10 ? `0${index + 1}` : index + 1}
                                        </div>
                                        {isSelected && (
                                            <motion.div
                                                initial={{ scale: 0 }}
                                                animate={{ scale: 1 }}
                                                className="flex lg:items-center justify-center lg:w-16"
                                            >
                                                <CheckCircle2 className="w-10 h-10 text-[var(--kinetic-teal)] drop-shadow-[0_0_15px_var(--kinetic-teal)]" />
                                            </motion.div>
                                        )}
                                    </div>

                                    {/* Detailed Info */}
                                    <div className="flex-1 space-y-8">
                                        <div className="flex flex-wrap items-start justify-between gap-6">
                                            <div>
                                                <h3 className="text-3xl font-black text-white font-display tracking-tight flex flex-wrap items-center gap-4">
                                                    {score.vendorName}
                                                    {!score.meetsConstraints && (
                                                        <span className="text-xs font-mono font-black bg-red-500/20 text-red-500 border border-red-500/40 px-3 py-1 rounded-lg uppercase tracking-widest shadow-[0_0_10px_rgba(255,0,0,0.2)]">
                                                            Constraint Violation
                                                        </span>
                                                    )}
                                                </h3>
                                                {score.vendor && (
                                                    <p className="text-base text-slate-400 mt-3 font-light max-w-2xl leading-relaxed">
                                                        {score.vendor.description}
                                                    </p>
                                                )}
                                            </div>
                                            {score.vendor && (
                                                <div className="text-right">
                                                    <div className="text-3xl font-black text-white font-display tracking-tighter">
                                                        ${score.vendor.pricePerMonth}
                                                        <span className="text-sm text-slate-500 ml-1.5 uppercase font-mono tracking-widest">/mo</span>
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        {/* Score Metrics */}
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                                            <MetricCard label="AGGREGATE" score={score.totalScore} variant="teal" />
                                            <MetricCard label="EFFICIENCY" score={score.costScore} variant="slate" />
                                            <MetricCard label="RELIABILITY" score={score.qualityScore} variant="slate" />
                                            <MetricCard label="UPTIME" score={score.slaScore} variant="slate" />
                                        </div>

                                        {/* Reasoning Block */}
                                        <div className="bg-white/5 border border-white/5 rounded-3xl p-6 relative group transition-all duration-500 hover:bg-white/[0.08]">
                                            <div className="flex items-center gap-3 mb-3 text-xs font-black text-[var(--kinetic-teal)] uppercase tracking-[0.3em] font-mono opacity-80">
                                                <Info className="w-4 h-4" />
                                                Gemini Strategic Reasoning
                                            </div>
                                            <p className="text-sm text-slate-400 leading-relaxed font-light italic">
                                                "{score.reasoning}"
                                            </p>
                                        </div>

                                        {/* Features & Action */}
                                        <div className="flex flex-wrap items-center justify-between gap-8 pt-4">
                                            <div className="flex flex-wrap gap-3">
                                                {score.vendor?.features.slice(0, 3).map((f, i) => (
                                                    <span key={i} className="text-sm font-mono font-bold bg-white/10 border border-white/10 px-3 py-1.5 rounded-lg text-slate-300 uppercase tracking-tight hover:border-[var(--kinetic-teal)]/30 transition-colors">
                                                        {f}
                                                    </span>
                                                ))}
                                            </div>
                                            <button className="flex items-center gap-3 text-xs font-black text-[var(--kinetic-teal)] hover:text-white transition-all uppercase tracking-widest font-mono group/doc">
                                                VIEW_ENTITY_DOCS
                                                <ExternalLink className="w-4 h-4 group-hover/doc:translate-x-1 group-hover/doc:-translate-y-1 transition-transform" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}

function MetricCard({
    label,
    score,
    variant,
}: {
    label: string;
    score: number;
    variant: "teal" | "slate";
}) {
    return (
        <div className={`rounded-3xl p-5 text-center border transition-all duration-500 hover:scale-[1.05] ${variant === "teal"
            ? "bg-[var(--kinetic-teal)]/10 border-[var(--kinetic-teal)]/40 shadow-[0_0_20px_rgba(0,255,255,0.1)]"
            : "bg-white/[0.03] border-white/10"
            }`}>
            <div className="text-xs font-black text-slate-500 mb-2.5 tracking-[0.25em] font-mono uppercase">{label}</div>
            <div className={`text-3xl font-black font-display tracking-tighter ${variant === "teal" ? "text-[var(--kinetic-teal)] drop-shadow-[0_0_10px_rgba(0,255,255,0.5)]" : "text-white"
                }`}>
                {score.toFixed(1)}
            </div>
        </div>
    );
}
