import { Wallet, KeySquare } from "lucide-react";

export default function TestWalletManager() {
    return (
        <div className="w-full bg-[#121821] border border-yellow-500/30 rounded-xl shadow-2xl overflow-hidden relative group">
            {/* Subtle warning glow */}
            <div className="absolute inset-0 bg-yellow-500/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />

            <div className="px-5 py-3 border-b border-white/10 bg-white/5 flex items-center justify-between relative z-10">
                <h2 className="text-xs font-mono font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <Wallet className="w-3.5 h-3.5 text-yellow-500" />
                    Test Wallet Manager
                </h2>
                <span className="text-[9px] font-mono text-yellow-500 uppercase tracking-widest bg-yellow-500/10 px-2 py-0.5 rounded border border-yellow-500/20">
                    Testnet Utility
                </span>
            </div>

            <div className="p-6 space-y-5 relative z-10">
                <p className="text-[10px] font-mono text-slate-400 leading-relaxed">
                    Generate temporary session wallets pre-funded with sFUEL and Test USDC to execute end-to-end testing flows without external dependencies.
                </p>

                <div className="bg-[#0B0F14] border border-white/10 rounded-lg p-4 space-y-4">
                    <div className="flex justify-between items-center text-[10px] font-mono border-b border-white/10 pb-3">
                        <span className="text-slate-500 uppercase tracking-wider">Active Session Wallet</span>
                        <span className="text-[var(--kinetic-teal)] font-bold">0xA21...9F4</span>
                    </div>

                    <div className="flex gap-3">
                        <div className="flex-1 bg-white/5 rounded-md p-3 flex flex-col justify-center items-center border border-white/5 gap-1 shadow-inner">
                            <span className="text-[9px] text-slate-500 font-mono uppercase tracking-widest">sFUEL Balance</span>
                            <span className="text-sm font-mono text-[var(--kinetic-teal)]">100.0</span>
                        </div>
                        <div className="flex-1 bg-white/5 rounded-md p-3 flex flex-col justify-center items-center border border-white/5 gap-1 shadow-inner">
                            <span className="text-[9px] text-slate-500 font-mono uppercase tracking-widest">USDC Balance</span>
                            <span className="text-sm font-mono text-[var(--cyber-lime)] border-b border-[var(--cyber-lime)]/30">1000.00</span>
                        </div>
                    </div>
                </div>

                <button className="w-full py-3.5 bg-yellow-500 hover:bg-yellow-400 text-black rounded-lg text-[10px] font-mono font-bold uppercase tracking-widest transition-colors flex justify-center items-center gap-2 shadow-[0_0_15px_rgba(234,179,8,0.2)]">
                    <KeySquare className="w-4 h-4" />
                    Generate & Prefund New Wallet
                </button>
            </div>
        </div>
    );
}
