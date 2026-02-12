"use client";

import { motion } from "framer-motion";
import {
    Rocket,
    CreditCard,
    Timer,
    ShieldCheck,
    CheckCircle2,
    Link as LinkIcon,
    ExternalLink,
    Lock
} from "lucide-react";

interface Props {
    paymentTxHash?: string;
    settlementStatus?: boolean;
    isCompleted?: boolean;
}

export default function PaymentTracker({
    paymentTxHash,
    settlementStatus,
    isCompleted,
}: Props) {
    const steps = [
        {
            title: "Payment Initiated",
            description: "Transaction broadcast to SKALE x402",
            completed: !!paymentTxHash,
            icon: Rocket,
            color: "var(--kinetic-teal)"
        },
        {
            title: "Smart Contract Execution",
            description: "Value transfer via x402 Protocol",
            completed: !!paymentTxHash,
            icon: CreditCard,
            color: "var(--kinetic-teal)"
        },
        {
            title: "On-Chain Settlement",
            description: "AP2 finality verification",
            completed: !!settlementStatus,
            icon: Timer,
            color: "var(--cyber-lime)"
        },
        {
            title: "Encrypted Audit Trail",
            description: "Privacy-preserved audit log created",
            completed: settlementStatus === true,
            icon: ShieldCheck,
            color: "var(--electric-violet)"
        },
        {
            title: "Operation Complete",
            description: "Procurement lifecycle finalized",
            completed: isCompleted === true,
            icon: CheckCircle2,
            color: "var(--cyber-lime)"
        },
    ];

    return (
        <div className="glass rounded-[2rem] p-10 border border-white/10 relative overflow-hidden group shadow-[0_30px_60px_rgba(0,0,0,0.6)]">
            {/* Background Accent - Vibrant */}
            <div className="absolute -bottom-32 -left-32 w-80 h-80 bg-[var(--kinetic-teal)]/10 blur-[100px] rounded-full pointer-events-none group-hover:bg-[var(--kinetic-teal)]/20 transition-colors duration-1000" />

            <div className="flex items-center justify-between mb-10 relative z-10">
                <h2 className="text-3xl font-black font-display text-white tracking-tighter uppercase">
                    On-Chain Lifecycle
                </h2>
                <div className="px-5 py-2 rounded-full border border-[var(--kinetic-teal)]/30 bg-[var(--kinetic-teal)]/10 text-[10px] font-mono text-[var(--kinetic-teal)] tracking-[0.2em] font-bold shadow-[0_0_15px_rgba(0,255,255,0.1)]">
                    SYNC_MODE: REALTIME_CORE
                </div>
            </div>

            {/* Transaction Hash Spotlight - Intensified */}
            {paymentTxHash && (
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="glass rounded-2xl p-8 mb-10 border border-[var(--kinetic-teal)]/30 bg-gradient-to-r from-[var(--kinetic-teal)]/15 via-black/40 to-transparent flex items-start gap-6 relative z-10 shadow-2xl"
                >
                    <div className="p-4 rounded-xl bg-[var(--kinetic-teal)]/20 text-[var(--kinetic-teal)] shadow-[0_0_20px_rgba(0,255,255,0.4)]">
                        <LinkIcon className="w-6 h-6" />
                    </div>
                    <div className="flex-1 overflow-hidden">
                        <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mb-3 font-mono">
                            Entity_TX_Pointer
                        </h3>
                        <div className="flex items-center gap-4">
                            <code className="text-xs text-[var(--kinetic-teal)] font-mono truncate block bg-black/40 p-3 rounded-xl border border-white/10 flex-1 shadow-inner">
                                {paymentTxHash}
                            </code>
                            <a
                                href={`https://explorer.skale.network/tx/${paymentTxHash}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-3 rounded-xl bg-white/5 border border-white/10 text-slate-300 hover:text-[var(--kinetic-teal)] hover:border-[var(--kinetic-teal)] hover:shadow-[0_0_15px_var(--kinetic-teal)] transition-all"
                            >
                                <ExternalLink className="w-5 h-5" />
                            </a>
                        </div>
                    </div>
                </motion.div>
            )}

            {/* Timeline Steps - More Spaced and Bold */}
            <div className="space-y-6 relative z-10 px-2">
                {steps.map((step, index) => {
                    const Icon = step.icon;
                    return (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, x: 30 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.12 }}
                            className={`flex items-center gap-7 p-6 rounded-3xl transition-all duration-500 border-2 ${step.completed
                                ? "bg-white/[0.04] border-white/10 shadow-xl"
                                : "bg-transparent border-dashed border-white/5 opacity-30 scale-95"
                                }`}
                        >
                            <div className={`
                                w-14 h-14 rounded-2xl flex items-center justify-center border-2 transition-all duration-700
                                ${step.completed
                                    ? "bg-white/5 border-white/30 text-white shadow-[0_0_15px_rgba(255,255,255,0.1)]"
                                    : "bg-transparent border-white/5 text-slate-700"}
                            `}>
                                <Icon className={`w-6 h-6 ${step.completed ? "animate-pulse" : ""}`} style={{ color: step.completed ? step.color : undefined }} />
                            </div>

                            <div className="flex-1">
                                <h3 className={`text-lg font-black tracking-tight uppercase ${step.completed ? "text-white" : "text-slate-700 font-bold"}`}>
                                    {step.title}
                                </h3>
                                <p className="text-xs text-slate-500 font-light mt-1 tracking-tight">{step.description}</p>
                            </div>

                            {step.completed && (
                                <motion.div
                                    initial={{ scale: 0, rotate: -45 }}
                                    animate={{ scale: 1, rotate: 0 }}
                                    className="w-7 h-7 rounded-full bg-[var(--kinetic-teal)]/20 flex items-center justify-center border border-[var(--kinetic-teal)]/40 shadow-[0_0_15px_var(--kinetic-teal)]"
                                >
                                    <CheckCircle2 className="w-4 h-4 text-[var(--kinetic-teal)]" />
                                </motion.div>
                            )}
                        </motion.div>
                    );
                })}
            </div>

            {/* Privacy Shield Footer - Vibrant Violet */}
            <div className="mt-12 p-7 rounded-3xl bg-gradient-to-br from-[var(--electric-violet)]/20 via-black/40 to-transparent border border-[var(--electric-violet)]/30 relative z-10 shadow-[0_0_40px_rgba(212,0,255,0.1)]">
                <div className="flex gap-6">
                    <div className="p-4 rounded-2xl bg-[var(--electric-violet)]/20 text-[var(--electric-violet)] shadow-[0_0_20px_rgba(212,0,255,0.4)]">
                        <Lock className="w-7 h-7" />
                    </div>
                    <div className="text-xs leading-relaxed">
                        <p className="font-black text-[var(--electric-violet)] uppercase tracking-[0.3em] mb-2 text-sm">Protocol Security Guarantee</p>
                        <p className="text-slate-400 font-light leading-relaxed">
                            Budget constraints were encrypted via <span className="text-[var(--electric-violet)] font-mono font-bold tracking-widest">SKALE_BITE_V4</span>.
                            Zero-knowledge proofs verify constraint satisfaction without revealing raw data to any intermediary.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
