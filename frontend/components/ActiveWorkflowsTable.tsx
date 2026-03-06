export default function ActiveWorkflowsTable() {
    const workflows = [
        { id: "1821", vendor: "ShipFast API", budget: "$80", status: "Payment" },
        { id: "1822", vendor: "DataTransit", budget: "$40", status: "Evaluation" },
        { id: "1823", vendor: "CargoAI", budget: "$120", status: "Settlement" },
    ];

    return (
        <div className="w-full bg-[#121821] border border-white/10 rounded-xl shadow-2xl overflow-hidden">
            <div className="px-5 py-3 border-b border-white/10 bg-white/5">
                <h2 className="text-xs font-mono font-bold text-slate-400 uppercase tracking-widest">
                    Active Workflows
                </h2>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="border-b border-white/5 bg-[#0B0F14]/50">
                            <th className="px-5 py-3 text-[10px] font-mono text-slate-500 uppercase tracking-wider font-normal">Workflow ID</th>
                            <th className="px-5 py-3 text-[10px] font-mono text-slate-500 uppercase tracking-wider font-normal">Vendor Selected</th>
                            <th className="px-5 py-3 text-[10px] font-mono text-slate-500 uppercase tracking-wider font-normal">Budget</th>
                            <th className="px-5 py-3 text-[10px] font-mono text-slate-500 uppercase tracking-wider font-normal">Status</th>
                            <th className="px-5 py-3 text-[10px] font-mono text-slate-500 uppercase tracking-wider font-normal text-right">Tx</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 font-mono text-xs">
                        {workflows.map((w, i) => (
                            <tr key={i} className="hover:bg-white/[0.02] transition-colors group">
                                <td className="px-5 py-4 text-slate-300">#{w.id}</td>
                                <td className="px-5 py-4 text-white font-bold">{w.vendor}</td>
                                <td className="px-5 py-4 text-slate-400">{w.budget}</td>
                                <td className="px-5 py-4">
                                    <span className={`px-2 py-1 rounded text-[10px] uppercase tracking-wider
                    ${w.status === 'Payment' ? 'bg-[var(--kinetic-teal)]/10 text-[var(--kinetic-teal)] border border-[var(--kinetic-teal)]/20' : ''}
                    ${w.status === 'Evaluation' ? 'bg-yellow-500/10 text-yellow-500 border border-yellow-500/20' : ''}
                    ${w.status === 'Settlement' ? 'bg-[var(--cyber-lime)]/10 text-[var(--cyber-lime)] border border-[var(--cyber-lime)]/20' : ''}
                  `}>
                                        {w.status}
                                    </span>
                                </td>
                                <td className="px-5 py-4 text-right">
                                    <button className="text-[var(--kinetic-teal)] opacity-50 group-hover:opacity-100 transition-opacity uppercase tracking-widest text-[10px] font-bold hover:underline">
                                        View
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
