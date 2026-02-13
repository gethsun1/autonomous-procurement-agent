import { motion } from "framer-motion";
import { Wallet, ExternalLink, AlertTriangle } from "lucide-react";

interface Props {
    error: string;
    walletAddress?: string;
}

export default function InsufficientFundsAlert({ error, walletAddress }: Props) {
    // Check if error is related to insufficient funds
    const isInsufficientFunds = error.toLowerCase().includes("balance is too low") ||
        error.toLowerCase().includes("insufficient");

    if (!isInsufficientFunds) {
        // Generic error display for other errors
        return (
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="glass-card p-6 mb-8 border border-red-500/30"
            >
                <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-red-500/10 flex items-center justify-center flex-shrink-0">
                        <AlertTriangle className="w-6 h-6 text-red-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-bold text-red-400 mb-2">
                            System Fault Detected
                        </h3>
                        <p className="text-sm text-gray-300 opacity-80 font-light leading-relaxed">
                            {error}
                        </p>
                    </div>
                </div>
            </motion.div>
        );
    }

    // Insufficient funds specific display
    const deployerAddress = walletAddress || "0x075823CffDD46A492A971Cf98D57FB35A5912Ec9";

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="relative overflow-hidden rounded-3xl mb-8"
        >
            {/* Animated Background */}
            <div className="absolute inset-0 bg-gradient-to-br from-violet-500/10 via-purple-500/5 to-transparent" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(168,85,247,0.1),transparent_50%)]" />

            {/* Content */}
            <div className="relative glass-card p-8 border border-violet-500/30">
                {/* Header */}
                <div className="flex items-start gap-4 mb-6">
                    <div className="relative">
                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-500/20 to-purple-500/20 flex items-center justify-center">
                            <Wallet className="w-7 h-7 text-violet-400" />
                        </div>
                        {/* Pulse animation */}
                        <div className="absolute inset-0 rounded-2xl bg-violet-500/20 animate-ping" />
                    </div>

                    <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-xl font-bold bg-gradient-to-r from-violet-400 to-purple-400 bg-clip-text text-transparent">
                                Awaiting Testnet Funds
                            </h3>
                            <span className="px-3 py-1 rounded-full bg-violet-500/10 border border-violet-500/30 text-xs font-mono text-violet-300">
                                DEMO_MODE
                            </span>
                        </div>
                        <p className="text-sm text-gray-400 font-light leading-relaxed">
                            Deployer wallet requires sFUEL to complete on-chain payment execution
                        </p>
                    </div>
                </div>

                {/* Wallet Info */}
                <div className="bg-black/30 rounded-xl p-5 mb-6 border border-white/5">
                    <div className="flex items-center justify-between mb-3">
                        <span className="text-xs font-mono text-gray-500 uppercase tracking-wider">
                            Deployer Address
                        </span>
                        <span className="text-xs font-mono text-violet-400">SKALE BASE SEPOLIA</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <code className="flex-1 text-sm font-mono text-cyan-300 bg-cyan-500/5 px-3 py-2 rounded-lg border border-cyan-500/20">
                            {deployerAddress}
                        </code>
                        <button
                            onClick={() => navigator.clipboard.writeText(deployerAddress)}
                            className="px-3 py-2 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 transition-all"
                            title="Copy address"
                        >
                            <svg className="w-4 h-4 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                        </button>
                    </div>
                </div>

                {/* Instructions */}
                <div className="space-y-4 mb-6">
                    <div className="flex items-start gap-3">
                        <div className="w-6 h-6 rounded-full bg-violet-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                            <span className="text-xs font-bold text-violet-300">1</span>
                        </div>
                        <div>
                            <p className="text-sm font-medium text-white mb-1">Visit SKALE Faucet</p>
                            <p className="text-xs text-gray-400 font-light">
                                Get free testnet sFUEL tokens for transaction execution
                            </p>
                        </div>
                    </div>

                    <div className="flex items-start gap-3">
                        <div className="w-6 h-6 rounded-full bg-violet-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                            <span className="text-xs font-bold text-violet-300">2</span>
                        </div>
                        <div>
                            <p className="text-sm font-medium text-white mb-1">Request Tokens</p>
                            <p className="text-xs text-gray-400 font-light">
                                Select Base Sepolia Testnet and paste your deployer address
                            </p>
                        </div>
                    </div>

                    <div className="flex items-start gap-3">
                        <div className="w-6 h-6 rounded-full bg-violet-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                            <span className="text-xs font-bold text-violet-300">3</span>
                        </div>
                        <div>
                            <p className="text-sm font-medium text-white mb-1">Retry Workflow</p>
                            <p className="text-xs text-gray-400 font-light">
                                Once funded, submit a new procurement request to complete full flow
                            </p>
                        </div>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-wrap gap-3">
                    <a
                        href="https://sfuelstation.com/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 min-w-[200px] btn-primary flex items-center justify-center gap-2 group"
                    >
                        <Wallet className="w-4 h-4" />
                        <span>Get sFUEL Tokens</span>
                        <ExternalLink className="w-3 h-3 opacity-50 group-hover:opacity-100 transition-opacity" />
                    </a>

                    <a
                        href="https://faucet.skale.network/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-5 py-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 transition-all flex items-center gap-2 text-sm font-medium"
                    >
                        <span>Alternative Faucet</span>
                        <ExternalLink className="w-3 h-3 opacity-50" />
                    </a>
                </div>

                {/* Status Note */}
                <div className="mt-6 pt-6 border-t border-white/5">
                    <p className="text-xs text-center text-gray-500 font-light">
                        <span className="text-violet-400 font-medium">✓ Vendor Selection Complete</span>
                        <span className="mx-2">•</span>
                        Payment execution paused pending wallet funding
                    </p>
                </div>
            </div>
        </motion.div>
    );
}
