import { motion } from "framer-motion";

interface AgentOperationsPanelProps {
    currentState: string;
}

export default function AgentOperationsPanel({ currentState }: AgentOperationsPanelProps) {
    const pipeline = [
        { state: "Initialized", label: "Initialized" },
        { state: "Discovery", label: "Discovery" },
        { state: "Evaluation", label: "Evaluation" },
        { state: "PaymentPending", label: "Payment" },
        { state: "Settled", label: "Settlement" },
        { state: "Completed", label: "Completed" },
    ];

    const getStageStatus = (stageState: string) => {
        // If we're at Completed, everything is complete
        if (currentState === "Completed" && stageState !== "Completed") return "complete";
        if (currentState === "Completed" && stageState === "Completed") return "complete";

        const currentIndex = pipeline.findIndex(p => p.state === currentState) || 0;
        const stageIndex = pipeline.findIndex(p => p.state === stageState);
        if (stageIndex < currentIndex) return "complete";
        if (stageIndex === currentIndex) return "active";
        return "pending";
    };

    return (
        <div className="w-full bg-[#121821] border border-white/10 rounded-xl shadow-2xl overflow-hidden">
            <div className="px-5 py-3 border-b border-white/10 bg-white/5 flex justify-between items-center">
                <h2 className="text-xs font-mono font-bold text-slate-400 uppercase tracking-widest">
                    Agent Status
                </h2>
                <div className="flex items-center gap-2 bg-[var(--kinetic-teal)]/10 px-2 py-0.5 rounded border border-[var(--kinetic-teal)]/20">
                    <div className="w-1.5 h-1.5 rounded-full bg-[var(--kinetic-teal)] animate-pulse" />
                    <span className="text-[10px] font-mono font-bold text-[var(--kinetic-teal)] tracking-widest uppercase">LIVE</span>
                </div>
            </div>

            <div className="p-6">
                <div className="grid grid-cols-2 gap-4 mb-6">
                    <div>
                        <span className="block text-[10px] font-mono text-slate-500 uppercase tracking-wider mb-1">Agent ID</span>
                        <span className="text-sm font-mono text-slate-200">ProcurementWorkflow_001</span>
                    </div>
                    <div>
                        <span className="block text-[10px] font-mono text-slate-500 uppercase tracking-wider mb-1">Registry</span>
                        <span className="text-sm font-mono text-slate-200">ERC-8004</span>
                    </div>
                    <div>
                        <span className="block text-[10px] font-mono text-slate-500 uppercase tracking-wider mb-1">Network</span>
                        <span className="text-sm font-mono text-slate-200">SKALE Base</span>
                    </div>
                    <div>
                        <span className="block text-[10px] font-mono text-slate-500 uppercase tracking-wider mb-1">Confidence Score</span>
                        <span className="text-sm font-mono text-[var(--cyber-lime)] font-bold">92%</span>
                    </div>
                </div>

                <div className="border border-white/5 rounded-lg p-5 bg-[#0B0F14]">
                    <span className="block text-[10px] font-mono text-slate-500 uppercase tracking-wider mb-5">Workflow Pipeline</span>
                    <div className="flex justify-between relative">
                        {/* Connecting line */}
                        <div className="absolute left-[10%] right-[10%] top-3 -translate-y-1/2 h-[2px] bg-white/10 z-0" />

                        {pipeline.map((stage, idx) => {
                            if (stage.state === "Completed") return null;
                            const status = getStageStatus(stage.state);
                            const isComplete = status === "complete";
                            const isActive = status === "active" && currentState !== "Completed";

                            return (
                                <div key={idx} className="relative z-10 flex flex-col items-center gap-3 bg-[#0B0F14] px-1 md:px-2">
                                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center bg-[#121821] transition-colors
                     ${isComplete ? 'border-[var(--cyber-lime)] text-[var(--cyber-lime)] bg-[var(--cyber-lime)]/10' :
                                            isActive ? 'border-[var(--kinetic-teal)] shadow-[0_0_10px_var(--kinetic-teal)] bg-[var(--kinetic-teal)]/10' :
                                                'border-white/20 text-transparent'}`}
                                    >
                                        {isComplete && <span className="text-[10px] font-bold">✓</span>}
                                        {isActive && <div className="w-2 h-2 rounded-full bg-[var(--kinetic-teal)]" />}
                                    </div>
                                    <span className={`text-[9px] md:text-[10px] font-mono uppercase tracking-wider text-center ${isActive ? 'text-[var(--kinetic-teal)] font-bold' : isComplete ? 'text-slate-300' : 'text-slate-600'}`}>
                                        {stage.label}
                                    </span>
                                </div>
                            )
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
}
