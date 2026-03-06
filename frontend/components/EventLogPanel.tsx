export default function EventLogPanel() {
    const events = [
        { time: "14:03:12", msg: "Workflow #1821 Initialized", type: "info" },
        { time: "14:03:18", msg: "Vendor Evaluation Completed", type: "success" },
        { time: "14:03:25", msg: "Escrow Payment Executed", type: "highlight" },
        { time: "14:03:26", msg: "Settlement Verification Pending", type: "warning" },
    ];

    return (
        <div className="w-full bg-[#121821] border border-white/10 rounded-xl shadow-2xl overflow-hidden h-full flex flex-col">
            <div className="px-5 py-3 border-b border-white/10 bg-white/5 flex items-center justify-between shrink-0">
                <h2 className="text-xs font-mono font-bold text-slate-400 uppercase tracking-widest">
                    System Event Log
                </h2>
                <div className="w-2 h-2 rounded-full bg-[var(--kinetic-teal)] animate-ping" />
            </div>
            <div className="p-5 overflow-y-auto flex-1 bg-[#0B0F14] font-mono text-[10px] space-y-3">
                {events.map((e, i) => (
                    <div key={i} className="flex items-start gap-4">
                        <span className="text-slate-600 shrink-0">{e.time}</span>
                        <span className={`
              ${e.type === 'info' ? 'text-slate-300' : ''}
              ${e.type === 'success' ? 'text-[var(--cyber-lime)]' : ''}
              ${e.type === 'highlight' ? 'text-[var(--kinetic-teal)] font-bold' : ''}
              ${e.type === 'warning' ? 'text-yellow-500' : ''}
            `}>
                            {e.msg}
                        </span>
                    </div>
                ))}
                {/* Blinking cursor effect for live log feel */}
                <div className="flex items-start gap-4 animate-pulse">
                    <span className="text-slate-600 shrink-0">--:--:--</span>
                    <span className="w-2 h-3 bg-[var(--kinetic-teal)] inline-block" />
                </div>
            </div>
        </div>
    );
}
