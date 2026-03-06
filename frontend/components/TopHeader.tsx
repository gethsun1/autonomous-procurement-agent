import { Wallet, Globe, Activity, LogOut, HelpCircle } from "lucide-react";
import { useWallet } from "@/context/WalletContext";
import InfoTooltip from "@/components/InfoTooltip";

export default function TopHeader() {
    const { address, isConnected, isCorrectNetwork, connectWallet, disconnectWallet, switchNetwork } = useWallet();

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
                    {isConnected ? (
                        <>
                            <div
                                className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-white/5 border border-white/10 cursor-pointer hover:bg-white/10 transition-colors"
                                onClick={disconnectWallet}
                                title="Disconnect Wallet"
                            >
                                <Wallet className="w-3.5 h-3.5 text-slate-400" />
                                <span className="text-slate-300">
                                    {address?.substring(0, 6)}...{address?.substring(address.length - 4)}
                                </span>
                                <LogOut className="w-3.5 h-3.5 text-slate-500 ml-1" />
                            </div>

                            <div
                                className={`flex items-center gap-2 px-3 py-1.5 rounded-md border cursor-pointer transition-colors ${isCorrectNetwork
                                    ? "bg-white/5 border-white/10 hover:bg-white/10"
                                    : "bg-red-500/10 border-red-500/30 hover:bg-red-500/20"
                                    }`}
                                onClick={!isCorrectNetwork ? switchNetwork : undefined}
                            >
                                <Globe className={`w-3.5 h-3.5 ${isCorrectNetwork ? "text-[var(--kinetic-teal)]" : "text-red-400"}`} />
                                <span className={isCorrectNetwork ? "text-slate-300" : "text-red-400 font-bold"}>
                                    {isCorrectNetwork ? "SKALE Base Sepolia" : "Wrong Network (Click to Switch)"}
                                </span>
                            </div>
                        </>
                    ) : (
                        <button
                            onClick={connectWallet}
                            className="flex items-center gap-2 px-4 py-1.5 rounded-md bg-[var(--kinetic-teal)] text-black font-bold hover:bg-[#00e5ff] transition-all shadow-[0_0_10px_rgba(0,212,255,0.3)]"
                        >
                            <Wallet className="w-3.5 h-3.5" />
                            <span>Connect Wallet</span>
                        </button>
                    )}

                    <button
                        onClick={() => (window as any).startAutonomousTour?.()}
                        className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-white/5 border border-white/10 hover:bg-white/10 transition-colors text-slate-300"
                        title="Replay Interactive Tour"
                    >
                        <HelpCircle className="w-3.5 h-3.5 text-blue-400" />
                        <span>Help Tour</span>
                    </button>

                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-yellow-500/10 border border-yellow-500/20">
                        <div className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse" />
                        <span className="text-yellow-400 font-bold">DEMO MODE</span>
                        <InfoTooltip content="All actions run safely on the SKALE Base Sepolia Testnet. No real funds are at risk." />
                    </div>
                </div>
            </div>
        </header>
    );
}
