export default function SystemOverview() {
    const metrics = [
        { label: "Active Workflows", value: "12", highlight: true },
        { label: "Payments Executed", value: "29", highlight: false },
        { label: "Settlements Finalized", value: "28", highlight: false },
        { label: "Total Value Processed", value: "$12,450", prefix: true, highlight: true },
        { label: "Avg Execution Time", value: "14s", highlight: false },
    ];

    return (
        <div className="w-full bg-[#121821] border border-white/10 rounded-xl overflow-hidden shadow-2xl">
            <div className="px-5 py-3 border-b border-white/10 bg-white/5 flex items-center justify-between">
                <h2 className="text-xs font-mono font-bold text-slate-400 uppercase tracking-widest">
                    System Overview
                </h2>
                <span className="text-xs font-mono text-[var(--kinetic-teal)] bg-[var(--kinetic-teal)]/10 px-2 py-0.5 rounded border border-[var(--kinetic-teal)]/20 uppercase tracking-widest">
                    Operational Control
                </span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-5 divide-x divide-y md:divide-y-0 divide-white/5">
                {metrics.map((m, i) => (
                    <div key={i} className="p-8 flex flex-col justify-between items-center text-center">
                        <span className="text-xs sm:text-sm font-mono text-slate-500 uppercase tracking-wider mb-2">
                            {m.label}
                        </span>
                        <div className="flex items-baseline gap-1">
                            <span className={`text-2xl sm:text-3xl font-display font-light ${m.highlight ? 'text-[var(--kinetic-teal)]' : 'text-slate-200'}`}>
                                {m.value}
                            </span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
