import { ExternalLink } from "lucide-react";

interface WorkflowDetailViewProps {
    workflowId: string | number;
    budget: number;
    selectedVendor: string;
    evaluationScore: number;
    timeline: { title: string; time: string; status: 'completed' | 'pending' | 'active' }[];
    escrowTx?: string;
    settlementTx?: string;
}

export default function WorkflowDetailView({
    workflowId, budget, selectedVendor, evaluationScore, timeline, escrowTx, settlementTx
}: WorkflowDetailViewProps) {
    return (
        <div className="w-full bg-[#121821] border border-white/10 rounded-xl shadow-2xl overflow-hidden mt-8">
            <div className="px-5 py-4 border-b border-white/10 bg-white/5 flex items-center justify-between">
                <h2 className="text-xs font-mono font-bold text-white uppercase tracking-widest flex items-center gap-3">
                    <span className="text-slate-500">Workflow</span> #{workflowId}
                </h2>
                <div className="px-2 py-0.5 rounded bg-[var(--kinetic-teal)]/10 border border-[var(--kinetic-teal)]/30 text-[var(--kinetic-teal)] text-[10px] font-mono tracking-widest uppercase font-bold flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-[var(--kinetic-teal)] animate-pulse" />
                    Deep Transparency
                </div>
            </div>

            <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
                <div className="space-y-8 flex flex-col justify-center">
                    <div className="grid grid-cols-2 gap-6 bg-[#0B0F14] p-5 rounded-lg border border-white/5">
                        <div>
                            <span className="block text-[10px] font-mono text-slate-500 uppercase tracking-wider mb-1">Budget Limit</span>
                            <span className="text-lg font-mono text-slate-200">{budget} USDC</span>
                        </div>
                        <div>
                            <span className="block text-[10px] font-mono text-slate-500 uppercase tracking-wider mb-1">Selected Vendor</span>
                            <span className="text-lg font-mono text-white font-bold">{selectedVendor}</span>
                        </div>
                        <div className="col-span-2">
                            <span className="block text-[10px] font-mono text-slate-500 uppercase tracking-wider mb-1">Evaluation Score</span>
                            <div className="flex items-center gap-3">
                                <span className="text-2xl font-mono text-[var(--cyber-lime)] font-bold">{evaluationScore}%</span>
                                <div className="h-2 flex-1 bg-white/5 rounded-full overflow-hidden">
                                    <div className="h-full bg-[var(--cyber-lime)]" style={{ width: `${evaluationScore}%` }} />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-3">
                        <span className="block text-[10px] font-mono text-slate-500 uppercase tracking-wider mb-3 px-1">Blockchain Verification</span>
                        {escrowTx && (
                            <a href={`https://base-sepolia.skalenodes.com/tx/${escrowTx}`} target="_blank" rel="noreferrer"
                                className="flex items-center justify-between p-4 rounded-lg bg-[#0B0F14] border border-white/5 hover:border-[var(--kinetic-teal)]/50 focus:border-[var(--kinetic-teal)]/50 transition-all group hover:bg-white/5 hover:-translate-y-0.5 shadow-sm hover:shadow-xl hover:shadow-[var(--kinetic-teal)]/10">
                                <span className="text-[11px] font-mono text-slate-300 uppercase tracking-widest">Escrow Tx</span>
                                <span className="text-[10px] font-mono text-[var(--kinetic-teal)] flex items-center gap-2 border-b border-[var(--kinetic-teal)]/0 group-hover:border-[var(--kinetic-teal)]/50 pb-0.5">
                                    View on SKALE Explorer <ExternalLink className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                                </span>
                            </a>
                        )}
                        {settlementTx ? (
                            <a href={`https://base-sepolia.skalenodes.com/tx/${settlementTx}`} target="_blank" rel="noreferrer"
                                className="flex items-center justify-between p-4 rounded-lg bg-[#0B0F14] border border-white/5 hover:border-[var(--cyber-lime)]/50 focus:border-[var(--cyber-lime)]/50 transition-all group hover:bg-white/5 hover:-translate-y-0.5 shadow-sm hover:shadow-xl hover:shadow-[var(--cyber-lime)]/10">
                                <span className="text-[11px] font-mono text-slate-300 uppercase tracking-widest">Settlement Tx</span>
                                <span className="text-[10px] font-mono text-[var(--cyber-lime)] flex items-center gap-2 border-b border-[var(--cyber-lime)]/0 group-hover:border-[var(--cyber-lime)]/50 pb-0.5">
                                    View on SKALE Explorer <ExternalLink className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                                </span>
                            </a>
                        ) : (
                            <div className="flex items-center justify-between p-4 rounded-lg bg-[#0B0F14]/50 border border-white/5 opacity-60">
                                <span className="text-[11px] font-mono text-slate-500 uppercase tracking-widest">Settlement Tx</span>
                                <span className="text-[10px] font-mono text-slate-600 border border-slate-700/50 px-2 py-0.5 rounded uppercase tracking-widest">Pending</span>
                            </div>
                        )}
                    </div>
                </div>

                <div className="space-y-4">
                    <span className="block text-[10px] font-mono text-slate-500 uppercase tracking-wider mb-2 px-1">Execution Timeline</span>
                    <div className="border border-white/5 rounded-lg p-6 bg-[#0B0F14] h-full">
                        <div className="space-y-6 relative ml-2">
                            {/* Vertical Pipeline Line */}
                            <div className="absolute left-2.5 top-3 bottom-4 w-px bg-gradient-to-b from-[var(--cyber-lime)] via-[var(--kinetic-teal)] to-white/10 opacity-50" />

                            {timeline.map((item, idx) => (
                                <div key={idx} className="flex gap-5 relative z-10 group">
                                    <div className={`w-5 h-5 rounded-full border border-[#0B0F14] flex items-center justify-center shrink-0 mt-0.5 transition-all
                     ${item.status === 'completed' ? 'bg-[var(--cyber-lime)] shadow-[0_0_15px_rgba(162,255,0,0.3)]' :
                                            item.status === 'active' ? 'bg-[var(--kinetic-teal)] shadow-[0_0_15px_rgba(0,255,255,0.4)]' :
                                                'bg-slate-800'}`}
                                    >
                                        {item.status === 'completed' && <span className="text-black text-[10px] font-bold">✓</span>}
                                        {item.status === 'active' && <div className="w-1.5 h-1.5 bg-black rounded-full animate-ping" />}
                                    </div>
                                    <div className="flex flex-col flex-1 pb-2">
                                        <span className={`text-[12px] font-mono tracking-wide ${item.status === 'pending' ? 'text-slate-500' : 'text-slate-200 group-hover:text-white transition-colors'}`}>
                                            {item.title}
                                        </span>
                                        <span className={`text-[9px] font-mono mt-1 
                       ${item.status === 'active' ? 'text-[var(--kinetic-teal)] font-bold animate-pulse' :
                                                item.status === 'completed' ? 'text-slate-400' : 'text-slate-600'}`}>
                                            {item.time || 'Awaiting execution'}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
