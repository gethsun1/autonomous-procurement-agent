import { Wallet, Globe, Activity } from "lucide-react";

export default function TopHeader() {
    return (
        <header className="w-full border-b border-white/10 bg-[#0B0F14] sticky top-0 z-50">
            {/* Testnet Banner */}
            <div className="bg-gradient-to-r from-yellow-500/20 via-yellow-400/10 to-transparent border-b border-yellow-500/30 px-4 py-1.5 flex items-center justify-center">
                <span className="text-[10px] md:text-xs font-mono text-yellow-500 font-bold uppercase tracking-widest text-center">
                    TESTNET DEMO MODE — Payments and settlements executed on SKALE Base Sepolia
                </span>
            </div>

            <div className="px-6 py-4 flex flex-col xl:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-6">
                    <div className="flex flex-col">
                        <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
                            <Activity className="w-5 h-5 text-[var(--kinetic-teal)]" />
                            Autonomous Procurement Agent
                        </h1>
                    </div>
                    <nav className="hidden lg:flex items-center gap-6 border-l border-white/10 pl-6 h-6">
                        <span className="text-xs font-mono font-bold text-[var(--kinetic-teal)] uppercase tracking-wider cursor-pointer">Dashboard</span>
                        <span className="text-xs font-mono font-medium text-slate-400 hover:text-white transition-colors uppercase tracking-wider cursor-pointer">Workflows</span>
                        <span className="text-xs font-mono font-medium text-slate-400 hover:text-white transition-colors uppercase tracking-wider cursor-pointer">Agents</span>
                        <span className="text-xs font-mono font-medium text-slate-400 hover:text-white transition-colors uppercase tracking-wider cursor-pointer">Payments</span>
                        <span className="text-xs font-mono font-medium text-slate-400 hover:text-white transition-colors uppercase tracking-wider cursor-pointer">Analytics</span>
                    </nav>
                </div>

                <div className="flex items-center flex-wrap justify-center gap-4 text-xs font-mono">
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-white/5 border border-white/10">
                        <Wallet className="w-3.5 h-3.5 text-slate-400" />
                        <span className="text-slate-300">0xA21...9F4</span>
                    </div>
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-white/5 border border-white/10">
                        <Globe className="w-3.5 h-3.5 text-[var(--kinetic-teal)]" />
                        <span className="text-slate-300">SKALE Base Sepolia</span>
                    </div>
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-yellow-500/10 border border-yellow-500/20">
                        <div className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse" />
                        <span className="text-yellow-400 font-bold">DEMO MODE</span>
                    </div>
                </div>
            </div>
        </header>
    );
}
