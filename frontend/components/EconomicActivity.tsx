export default function EconomicActivity() {
    return (
        <div className="w-full bg-[#121821] border border-white/10 rounded-xl shadow-2xl overflow-hidden h-full flex flex-col">
            <div className="px-5 py-3 border-b border-white/10 bg-white/5 shrink-0">
                <h2 className="text-xs font-mono font-bold text-slate-400 uppercase tracking-widest">
                    Economic Activity
                </h2>
            </div>
            <div className="p-6 space-y-8 flex-1 flex flex-col justify-center">
                <div>
                    <div className="flex justify-between items-end mb-2">
                        <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">Workflows Per Hour</span>
                        <span className="text-sm font-mono text-white">4.2</span>
                    </div>
                    <div className="w-full h-1.5 bg-[#0B0F14] rounded-full overflow-hidden border border-white/5">
                        <div className="h-full bg-[var(--kinetic-teal)] w-[40%]" />
                    </div>
                </div>

                <div>
                    <div className="flex justify-between items-end mb-2">
                        <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">Payment Volume (24H)</span>
                        <span className="text-sm font-mono text-white">$1,240</span>
                    </div>
                    <div className="w-full h-1.5 bg-[#0B0F14] rounded-full overflow-hidden border border-white/5">
                        <div className="h-full bg-[var(--cyber-lime)] w-[65%]" />
                    </div>
                </div>

                <div>
                    <div className="flex justify-between items-end mb-2">
                        <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">Settlement Latency</span>
                        <span className="text-sm font-mono text-white">1.2s</span>
                    </div>
                    <div className="w-full h-1.5 bg-[#0B0F14] rounded-full overflow-hidden border border-white/5">
                        <div className="h-full bg-yellow-500 w-[15%]" />
                    </div>
                </div>
            </div>
        </div>
    );
}
