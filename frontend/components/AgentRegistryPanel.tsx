import { ShieldCheck, ExternalLink } from "lucide-react";

export default function AgentRegistryPanel() {
    return (
        <div className="w-full bg-[#121821] border border-white/10 rounded-xl shadow-2xl overflow-hidden h-full flex flex-col">
            <div className="px-5 py-3 border-b border-white/10 bg-white/5 flex items-center gap-2 shrink-0">
                <ShieldCheck className="w-4 h-4 text-[var(--kinetic-teal)]" />
                <h2 className="text-xs font-mono font-bold text-slate-400 uppercase tracking-widest">
                    Agent Registry
                </h2>
            </div>
            <div className="p-6 space-y-5 flex-1 flex flex-col justify-center">
                <div>
                    <span className="block text-[10px] font-mono text-slate-500 uppercase tracking-wider mb-1">Agent Type</span>
                    <span className="text-xs font-mono text-white">Procurement Workflow Agent</span>
                </div>
                <div>
                    <span className="block text-[10px] font-mono text-slate-500 uppercase tracking-wider mb-1">Registry Standard</span>
                    <span className="inline-block px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-white/10 text-slate-300 border border-white/20">
                        ERC-8004
                    </span>
                </div>
                <div>
                    <span className="block text-[10px] font-mono text-slate-500 uppercase tracking-wider mb-1">Registered Address</span>
                    <span className="text-[10px] font-mono text-[var(--kinetic-teal)] break-all px-2 py-1 bg-[var(--kinetic-teal)]/10 rounded inline-block border border-[var(--kinetic-teal)]/20">
                        0x881c5b9a28CCEaa78B89F2a61A82294c5Baf8e10
                    </span>
                </div>
                <div className="pt-2">
                    <button className="w-full py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded text-[10px] font-mono text-slate-300 uppercase tracking-widest transition-colors flex justify-center items-center gap-2">
                        View Agent Profile <ExternalLink className="w-3 h-3" />
                    </button>
                </div>
            </div>
        </div>
    );
}
