"use client";

interface Props {
    currentState: string;
    error?: string;
}

const WORKFLOW_STATES = [
    { name: "Initialized", icon: "📝", color: "blue" },
    { name: "Discovery", icon: "🔍", color: "purple" },
    { name: "Evaluation", icon: "🤖", color: "pink" },
    { name: "Selection", icon: "✅", color: "green" },
    { name: "PaymentPending", icon: "💰", color: "yellow" },
    { name: "Settled", icon: "🔒", color: "orange" },
    { name: "Completed", icon: "🎉", color: "emerald" },
];

const getStateIndex = (state: string) => {
    return WORKFLOW_STATES.findIndex((s) => s.name === state);
};

const getColorClass = (color: string) => {
    const colors: Record<string, string> = {
        blue: "bg-blue-500",
        purple: "bg-purple-500",
        pink: "bg-pink-500",
        green: "bg-green-500",
        yellow: "bg-yellow-500",
        orange: "bg-orange-500",
        emerald: "bg-emerald-500",
    };
    return colors[color] || "bg-gray-500";
};

export default function WorkflowVisualizer({ currentState, error }: Props) {
    const currentIndex = getStateIndex(currentState);
    const isError = currentState === "Error";

    if (isError) {
        return (
            <div className="glass rounded-2xl p-8">
                <div className="text-center space-y-4">
                    <div className="text-6xl">❌</div>
                    <h3 className="text-2xl font-bold text-red-400">Workflow Error</h3>
                    <p className="text-gray-400">{error || "An unknown error occurred"}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="glass rounded-2xl p-8">
            <h2 className="text-2xl font-bold gradient-text mb-8 text-center">
                Autonomous Workflow Progress
            </h2>

            {/* Progress Bar */}
            <div className="mb-8">
                <div className="relative h-2 bg-gray-700 rounded-full overflow-hidden">
                    <div
                        className="h-full bg-gradient-to-r from-primary to-accent transition-all duration-700 ease-out"
                        style={{
                            width: `${((currentIndex + 1) / WORKFLOW_STATES.length) * 100}%`,
                        }}
                    />
                </div>
            </div>

            {/* States Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
                {WORKFLOW_STATES.map((state, index) => {
                    const isActive = index === currentIndex;
                    const isCompleted = index < currentIndex;
                    const isPending = index > currentIndex;

                    return (
                        <div
                            key={state.name}
                            className={`relative p-4 rounded-xl border-2 transition-all duration-300 ${isActive
                                    ? "border-primary bg-primary/20 scale-105"
                                    : isCompleted
                                        ? "border-green-500 bg-green-500/10"
                                        : "border-gray-700 bg-gray-800/50"
                                }`}
                        >
                            {/* Icon */}
                            <div className="text-4xl mb-2 text-center">
                                {isActive ? (
                                    <span className="pulse-glow inline-block">{state.icon}</span>
                                ) : (
                                    state.icon
                                )}
                            </div>

                            {/* State Name */}
                            <div
                                className={`text-xs font-semibold text-center ${isActive
                                        ? "text-white"
                                        : isCompleted
                                            ? "text-green-400"
                                            : "text-gray-500"
                                    }`}
                            >
                                {state.name}
                            </div>

                            {/* Status Indicator */}
                            {isActive && (
                                <div className="absolute -top-2 -right-2">
                                    <div className="h-4 w-4 bg-primary rounded-full pulse-glow" />
                                </div>
                            )}
                            {isCompleted && (
                                <div className="absolute -top-2 -right-2">
                                    <div className="h-4 w-4 bg-green-500 rounded-full flex items-center justify-center text-xs">
                                        ✓
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Current State Info */}
            <div className="mt-8 glass rounded-xl p-6 border border-primary/30 bg-primary/5">
                <div className="flex items-center gap-4">
                    <div className="text-5xl">
                        {WORKFLOW_STATES[currentIndex]?.icon || "⏳"}
                    </div>
                    <div className="flex-1">
                        <h3 className="text-xl font-bold text-white mb-1">
                            {currentState}
                        </h3>
                        <p className="text-gray-400 text-sm">
                            {getStateDescription(currentState)}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}

function getStateDescription(state: string): string {
    const descriptions: Record<string, string> = {
        Initialized: "Procurement request submitted and encrypted constraints stored",
        Discovery: "Discovering available vendors in the marketplace",
        Evaluation: "Gemini AI is evaluating and ranking vendors based on your criteria",
        Selection: "Best vendor selected, preparing payment execution",
        PaymentPending: "Payment executing via SKALE x402 protocol",
        Settled: "Transaction settled via AP2, finalizing procurement",
        Completed: "Procurement completed successfully! 🎊",
    };
    return descriptions[state] || "Processing...";
}
