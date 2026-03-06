import { Info } from "lucide-react";

interface InfoTooltipProps {
    content: string;
}

export default function InfoTooltip({ content }: InfoTooltipProps) {
    return (
        <div className="relative group inline-flex items-center justify-center ml-1.5 align-middle cursor-help">
            <Info className="w-3.5 h-3.5 text-slate-500 group-hover:text-[var(--kinetic-teal)] transition-colors" />

            {/* Tooltip Overlay */}
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2.5 bg-[#0B0F14] border border-white/10 rounded-lg shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 pointer-events-none transform group-hover:-translate-y-1">
                <p className="text-[10px] font-mono leading-relaxed text-slate-300 text-center">
                    {content}
                </p>
                {/* Carrot */}
                <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-px border-4 border-transparent border-t-[#0B0F14]" />
                <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-white/10 mt-px z-[-1]" />
            </div>
        </div>
    );
}
