import { AlertTriangle, X, CloudOff } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface ApiErrorModalProps {
    isOpen: boolean;
    onClose: () => void;
    error: string | null;
}

export default function ApiErrorModal({ isOpen, onClose, error }: ApiErrorModalProps) {
    if (!error) return null;

    // Check if it's a Gemini/Quota error based on common strings
    const isQuotaError = error.toLowerCase().includes("quota") ||
        error.toLowerCase().includes("429") ||
        error.toLowerCase().includes("rate limit") ||
        error.toLowerCase().includes("overloaded") ||
        error.toLowerCase().includes("fetch failed");

    // Determine title, message and icon
    const title = isQuotaError ? "AI Provider Quota Exceeded" : "Execution Error";
    const message = isQuotaError
        ? "The autonomous agent's AI reasoning engine (Google Gemini) is currently experiencing high demand or has exceeded its request quota. Please wait a few moments and try deploying the agent again."
        : "The autonomous agent encountered an unexpected error during execution. Please review the error details and try again.";

    const Icon = isQuotaError ? CloudOff : AlertTriangle;

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-sm">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 10 }}
                        transition={{ duration: 0.2, ease: "easeOut" }}
                        className="w-full max-w-md bg-[#0B0F14] border border-red-500/30 rounded-xl shadow-[0_0_40px_rgba(239,68,68,0.15)] overflow-hidden relative"
                    >
                        {/* Elegant top accent line */}
                        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-red-600 via-orange-500 to-red-600" />

                        <div className="p-6">
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center border border-red-500/20 shrink-0 shadow-inner">
                                        <Icon className="w-5 h-5 text-red-500" />
                                    </div>
                                    <h3 className="text-lg font-bold text-white tracking-tight">{title}</h3>
                                </div>
                                <button
                                    onClick={onClose}
                                    className="text-slate-500 hover:text-white transition-colors p-1 rounded-md hover:bg-white/5"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="space-y-4">
                                <p className="text-sm text-slate-300 leading-relaxed font-sans">
                                    {message}
                                </p>

                                <div className="bg-black/50 border border-white/5 rounded-lg p-3 font-mono text-[10px] text-red-400 overflow-x-auto whitespace-pre-wrap break-words max-h-32 shadow-inner">
                                    <span className="text-slate-500 block mb-1 uppercase tracking-widest text-[9px]">Raw Trace:</span>
                                    {error}
                                </div>
                            </div>

                            <div className="mt-6 pt-5 border-t border-white/10 flex justify-end gap-3">
                                <button
                                    onClick={onClose}
                                    className="px-5 py-2.5 rounded-lg bg-red-500 hover:bg-red-600 text-white text-xs font-bold font-mono tracking-widest uppercase transition-all shadow-[0_0_15px_rgba(239,68,68,0.2)]"
                                >
                                    Understood, Dismiss
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
