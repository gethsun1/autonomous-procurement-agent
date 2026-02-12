"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Lock, Cpu, BarChart3, Clock, ArrowRight } from "lucide-react";

export interface ProcurementFormData {
    brief: string;
    maxBudget: number;
    minQualityScore: number;
    preferredSLA: number;
    durationDays: number;
}

interface Props {
    onSubmit: (data: ProcurementFormData) => void;
    loading?: boolean;
}

export default function ProcurementRequestForm({ onSubmit, loading }: Props) {
    const [formData, setFormData] = useState<ProcurementFormData>({
        brief: "",
        maxBudget: 500,
        minQualityScore: 7.0,
        preferredSLA: 99.0,
        durationDays: 30,
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit(formData);
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card p-10 relative overflow-hidden group shadow-[0_20px_50px_rgba(0,0,0,0.5)]"
        >
            {/* Ambient Background Glow - Intensified */}
            <div className="absolute -top-32 -right-32 w-80 h-80 bg-[var(--kinetic-teal)]/10 blur-[100px] rounded-full pointer-events-none group-hover:bg-[var(--kinetic-teal)]/20 transition-colors duration-1000" />
            <div className="absolute -bottom-32 -left-32 w-80 h-80 bg-[var(--electric-violet)]/10 blur-[100px] rounded-full pointer-events-none group-hover:bg-[var(--electric-violet)]/20 transition-colors duration-1000" />

            <div className="mb-12 relative z-10 text-center md:text-left">
                <div className="flex flex-col md:flex-row items-center gap-4 mb-4">
                    <div className="p-3 rounded-xl bg-white/5 border border-white/10 text-[var(--kinetic-teal)] shadow-[0_0_15px_rgba(0,255,255,0.2)]">
                        <Cpu className="w-6 h-6" />
                    </div>
                    <h2 className="text-4xl font-black font-display text-white tracking-tighter uppercase">
                        Mission Control
                    </h2>
                </div>
                <p className="text-slate-400 text-base max-w-xl font-light leading-relaxed">
                    Define your autonomous procurement parameters. Our agent will execute the rest on-chain with <span className="text-[var(--kinetic-teal)] font-bold">Absolute Finality</span>.
                </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-12 relative z-10">
                {/* Section 1: Requirement Brief */}
                <div className="space-y-6">
                    <div className="flex items-center gap-3">
                        <BarChart3 className="w-5 h-5 text-[var(--kinetic-teal)] animate-pulse" />
                        <h3 className="text-sm font-black uppercase tracking-[0.3em] text-[var(--kinetic-teal)] opacity-80">
                            1. Strategic Objective
                        </h3>
                    </div>
                    <div className="input-group">
                        <textarea
                            id="brief"
                            value={formData.brief}
                            onChange={(e) =>
                                setFormData({ ...formData, brief: e.target.value })
                            }
                            placeholder=" "
                            rows={3}
                            required
                            className="input-field resize-none font-sans"
                        />
                        <label htmlFor="brief" className="input-label text-base">
                            Specify Service or Product Requirements...
                        </label>
                    </div>
                </div>

                {/* Section 2: Encrypted Constraints */}
                <div className="space-y-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <Lock className="w-5 h-5 text-[var(--electric-violet)]" />
                            <h3 className="text-sm font-black uppercase tracking-[0.3em] text-[var(--electric-violet)] opacity-80">
                                2. Bound Constraints
                            </h3>
                        </div>
                        <span className="flex items-center gap-3 text-xs px-4 py-1.5 rounded-full border border-[var(--electric-violet)]/40 bg-[var(--electric-violet)]/20 text-[var(--electric-violet)] font-mono font-bold shadow-[0_0_20px_rgba(212,0,255,0.2)]">
                            <Lock className="w-3 h-3" />
                            X402_ENCRYPT_ACTIVE
                        </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                        {/* Encrypted Budget Field */}
                        <div className="input-group">
                            <input
                                id="budget"
                                type="number"
                                value={formData.maxBudget}
                                onChange={(e) =>
                                    setFormData({
                                        ...formData,
                                        maxBudget: parseFloat(e.target.value),
                                    })
                                }
                                placeholder=" "
                                required
                                min="0"
                                step="10"
                                className="input-field-encrypted font-mono"
                            />
                            <label htmlFor="budget" className="input-label">
                                Maximum Authorized Budget (USDC)
                            </label>
                        </div>

                        <div className="input-group">
                            <input
                                id="duration"
                                type="number"
                                value={formData.durationDays}
                                onChange={(e) =>
                                    setFormData({
                                        ...formData,
                                        durationDays: parseInt(e.target.value),
                                    })
                                }
                                placeholder=" "
                                required
                                min="1"
                                className="input-field font-mono"
                            />
                            <label htmlFor="duration" className="input-label">
                                Contract Duration (Days)
                            </label>
                        </div>
                    </div>
                </div>

                {/* Section 3: Quality Standards */}
                <div className="space-y-10">
                    <div className="flex items-center gap-3">
                        <Clock className="w-5 h-5 text-[var(--cyber-lime)]" />
                        <h3 className="text-sm font-black uppercase tracking-[0.3em] text-[var(--cyber-lime)] opacity-80">
                            3. Quality Thresholds
                        </h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                        {/* Quality Score Slider */}
                        <div className="space-y-5">
                            <div className="flex justify-between items-end">
                                <span className="text-xs text-slate-400 font-bold tracking-widest uppercase">Min. Quality Score</span>
                                <span className="text-2xl font-black font-mono text-[var(--kinetic-teal)] drop-shadow-[0_0_10px_rgba(0,255,255,0.5)]">
                                    {formData.minQualityScore.toFixed(1)}<span className="text-xs text-slate-600 ml-1">/ 10.0</span>
                                </span>
                            </div>
                            <input
                                type="range"
                                min="0"
                                max="10"
                                step="0.1"
                                value={formData.minQualityScore}
                                onChange={(e) => setFormData({ ...formData, minQualityScore: parseFloat(e.target.value) })}
                                className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-[var(--kinetic-teal)] hover:shadow-[0_0_20px_var(--kinetic-teal)] transition-all"
                            />
                        </div>

                        {/* SLA Slider */}
                        <div className="space-y-5">
                            <div className="flex justify-between items-end">
                                <span className="text-xs text-slate-400 font-bold tracking-widest uppercase">Uptime SLA Threshold</span>
                                <span className="text-2xl font-black font-mono text-[var(--kinetic-teal)] drop-shadow-[0_0_10px_rgba(0,255,255,0.5)]">
                                    {formData.preferredSLA.toFixed(1)}<span className="text-sm text-slate-600 ml-0.5">%</span>
                                </span>
                            </div>
                            <input
                                type="range"
                                min="90"
                                max="100"
                                step="0.1"
                                value={formData.preferredSLA}
                                onChange={(e) => setFormData({ ...formData, preferredSLA: parseFloat(e.target.value) })}
                                className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-[var(--kinetic-teal)] hover:shadow-[0_0_20px_var(--kinetic-teal)] transition-all"
                            />
                        </div>
                    </div>
                </div>

                {/* Submit Action */}
                <div className="pt-10">
                    <button
                        type="submit"
                        disabled={loading}
                        className="btn-primary group/btn relative shadow-[0_0_30px_rgba(0,255,255,0.3)]"
                    >
                        {loading ? (
                            <span className="flex items-center justify-center gap-4">
                                <div className="w-6 h-6 border-3 border-black/20 border-t-black rounded-full animate-spin" />
                                <span className="font-extrabold tracking-[0.2em]">SYNCHRONIZING_CORE...</span>
                            </span>
                        ) : (
                            <span className="flex items-center justify-center gap-4">
                                <span className="font-extrabold tracking-[0.2em]">INITIATE_AUTONOMOUS_STACK</span>
                                <ArrowRight className="w-6 h-6 group-hover/btn:translate-x-2 transition-transform" />
                            </span>
                        )}
                    </button>
                    <div className="flex items-center justify-center gap-3 mt-8">
                        <div className="w-2 h-2 rounded-full bg-[var(--cyber-lime)] animate-pulse shadow-[0_0_10px_var(--cyber-lime)]" />
                        <p className="text-xs text-slate-500 font-mono font-black uppercase tracking-[0.3em]">
                            SECURE_ON_CHAIN_EXECUTION_NODE • v4.2.0
                        </p>
                    </div>
                </div>
            </form>
        </motion.div>
    );
}
