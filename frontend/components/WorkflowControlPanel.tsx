import { useState } from "react";
import { Info, Play } from "lucide-react";
import InfoTooltip from "@/components/InfoTooltip";

export interface DashboardProcurementData {
    brief: string;
    maxBudget: number;
    minQualityScore: number;
    preferredSLA: number;
    durationDays: number;
}

interface WorkflowControlPanelProps {
    onSubmit: (data: DashboardProcurementData) => void;
    loading: boolean;
}

export default function WorkflowControlPanel({ onSubmit, loading }: WorkflowControlPanelProps) {
    const [budget, setBudget] = useState("100");
    const [priority, setPriority] = useState("Balanced");
    const [category, setCategory] = useState("Logistics API");

    const handleSubmit = () => {
        onSubmit({
            brief: `Procure a ${category} focusing on ${priority} options.`,
            maxBudget: parseFloat(budget) || 100,
            minQualityScore: priority === "Reliability" ? 9 : 7,
            preferredSLA: priority === "Reliability" ? 99.9 : 99.0,
            durationDays: 30
        });
    };

    return (
        <div className="w-full bg-[#121821] border border-white/10 rounded-xl shadow-2xl overflow-hidden">
            <div className="px-5 py-3 border-b border-white/10 bg-white/5 flex justify-between items-center">
                <h2 className="text-xs font-mono font-bold text-slate-400 uppercase tracking-widest">
                    Create Procurement Workflow
                </h2>
                <span className="text-[10px] font-mono text-yellow-500 bg-yellow-500/10 px-2 py-0.5 rounded border border-yellow-500/20 uppercase tracking-widest">
                    Execution Agent
                </span>
            </div>

            <div className="p-6 space-y-6">
                {/* Row 1 */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2 group">
                        <label className="text-[10px] font-mono text-slate-500 uppercase tracking-wider flex items-center justify-between">
                            <span className="flex items-center">
                                Budget Limit
                                <InfoTooltip content="Set the rigid maximum budget in USDC for the autonomous procurement." />
                            </span>
                            <span className="text-[10px] text-slate-600">USDC</span>
                        </label>
                        <div className="relative">
                            <input
                                type="number"
                                value={budget}
                                onChange={(e) => setBudget(e.target.value)}
                                className="w-full bg-[#0B0F14] border border-white/10 rounded-lg px-4 py-3 text-white font-mono focus:border-[var(--kinetic-teal)] focus:ring-1 focus:ring-[var(--kinetic-teal)] outline-none transition-all"
                                placeholder="0.00"
                            />
                            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 font-mono text-sm uppercase">USDC</span>
                        </div>
                        <p className="text-[9px] font-mono text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity">Maximum budget allocated to this procurement round.</p>
                    </div>

                    <div className="space-y-2 group">
                        <label className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">
                            Supplier Category
                        </label>
                        <input
                            type="text"
                            value={category}
                            onChange={(e) => setCategory(e.target.value)}
                            className="w-full bg-[#0B0F14] border border-white/10 rounded-lg px-4 py-3 text-white font-mono focus:border-[var(--kinetic-teal)] focus:ring-1 focus:ring-[var(--kinetic-teal)] outline-none transition-all"
                            placeholder="e.g. Logistics API"
                        />
                        <p className="text-[9px] font-mono text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity">The specific service or product category to procure.</p>
                    </div>
                </div>

                {/* Row 2 */}
                <div className="space-y-3 group">
                    <label className="text-[10px] font-mono text-slate-500 uppercase tracking-wider flex justify-between items-center">
                        <span className="flex items-center">
                            Evaluation Priority
                            <InfoTooltip content="Determines which weighted algorithm the agent uses to select the winning vendor proposal." />
                            <span className="text-slate-600 ml-1">(Execution Constraints)</span>
                        </span>
                        <span className="text-[9px] text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity">Max 3 vendors evaluated</span>
                    </label>
                    <div className="grid grid-cols-3 gap-3">
                        {["Lowest Cost", "Balanced", "Reliability"].map(opt => (
                            <button
                                key={opt}
                                onClick={() => setPriority(opt)}
                                className={`flex items-center justify-center py-2.5 px-4 rounded-lg font-mono text-xs transition-all border
                  ${priority === opt
                                        ? 'bg-[var(--kinetic-teal)]/10 text-[var(--kinetic-teal)] border-[var(--kinetic-teal)]/50 shadow-[0_0_15px_rgba(0,255,255,0.1)]'
                                        : 'bg-[#0B0F14] text-slate-400 border-white/10 hover:border-white/30'}`}
                            >
                                {opt}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Info & Submit */}
                <div className="pt-4 flex flex-col md:flex-row items-center justify-between gap-4 border-t border-white/5">
                    <div className="flex items-center gap-3 px-3 py-2 rounded bg-black/40 border border-white/5 text-slate-400 flex-1 relative group cursor-help">
                        <Info className="w-4 h-4 text-[var(--kinetic-teal)] min-w-[16px]" />
                        <span className="text-[10px] font-mono leading-tight">
                            Defines the economic boundaries under which the agent may operate.
                        </span>
                        {/* Tooltip */}
                        <div className="absolute bottom-full left-0 mb-2 w-64 bg-[#121821] border border-[var(--kinetic-teal)]/30 rounded p-2 text-[10px] font-mono text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-xl z-10">
                            The agent will autonomously evaluate available vendors against these constraints before executing payment.
                        </div>
                    </div>

                    <button
                        onClick={handleSubmit}
                        disabled={loading}
                        className="flex-shrink-0 flex items-center justify-center gap-2 bg-[var(--kinetic-teal)] text-black px-8 py-3 rounded-lg font-bold font-mono text-sm uppercase tracking-wider hover:bg-[#00e6e6] transition-colors disabled:opacity-50 min-w-[200px]"
                    >
                        {loading ? (
                            <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                        ) : (
                            <Play className="w-4 h-4 fill-black" />
                        )}
                        {loading ? "INITIALIZING..." : "LAUNCH WORKFLOW"}
                    </button>
                </div>
            </div>
        </div>
    );
}
