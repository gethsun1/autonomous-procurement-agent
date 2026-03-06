import { ExternalLink, CreditCard, Loader2 } from "lucide-react";
import { useWallet, TEST_USDC_ADDRESS } from "@/context/WalletContext";
import { useState } from "react";
import { ethers } from "ethers";
import InfoTooltip from "@/components/InfoTooltip";

interface WorkflowDetailViewProps {
    workflowId: string | number;
    budget: number;
    selectedVendor: string;
    evaluationScore: number;
    timeline: { title: string; time: string; status: 'completed' | 'pending' | 'active' }[];
    escrowTx?: string;
    settlementTx?: string;
    status: string;
    onPaymentSuccess?: () => void;
}

// Ensure you replace this with the actual deployed ProcurementWorkflow address from your .env
const PROCUREMENT_WORKFLOW_ADDRESS = process.env.NEXT_PUBLIC_PROCUREMENT_WORKFLOW_ADDRESS || "0xYOUR_CONTRACT_ADDRESS";

export default function WorkflowDetailView({
    workflowId, budget, selectedVendor, evaluationScore, timeline, escrowTx, settlementTx, status, onPaymentSuccess
}: WorkflowDetailViewProps) {
    const { signer, address, isConnected, isCorrectNetwork } = useWallet();
    const [isExecutingPayment, setIsExecutingPayment] = useState(false);

    const handleExecutePayment = async () => {
        if (!signer || !address || !isCorrectNetwork) {
            alert("Please connect your wallet to SKALE Base Sepolia first.");
            return;
        }

        try {
            setIsExecutingPayment(true);

            // 1. Approve USDC transfer
            const usdcAbi = ["function approve(address spender, uint256 amount) public returns (bool)"];
            const usdcContract = new ethers.Contract(TEST_USDC_ADDRESS, usdcAbi, signer);

            // Format budget to 6 decimals (assuming DemoUSDC)
            const paymentAmount = ethers.parseUnits(budget.toString(), 6);

            console.log("Approving USDC...");
            const approveTx = await usdcContract.approve(PROCUREMENT_WORKFLOW_ADDRESS, paymentAmount);
            await approveTx.wait();
            console.log("USDC Approved!");

            // 2. Execute Payment on ProcurementWorkflow
            // Note: Update ABI matching your contract's executePayment function
            const workflowAbi = ["function executePayment(uint256 workflowId, address vendorAddress, uint256 amount) public"];
            const workflowContract = new ethers.Contract(PROCUREMENT_WORKFLOW_ADDRESS, workflowAbi, signer);

            console.log("Executing Payment...");
            // Notice: In the real flow, vendorAddress is resolved by the agent. 
            // We pass a dummy address or rely on the backend to provide it, but for demo, 
            // the contract might just need the workflowId and amount if it fetches the vendor internally.
            // Adjust the function signature below as per your actual contract logic.
            const paymentTx = await workflowContract.executePayment(workflowId, TEST_USDC_ADDRESS, paymentAmount);

            console.log(`Payment transaction submitted: ${paymentTx.hash}`);
            await paymentTx.wait();
            console.log("Payment Confirmed!");

            // 3. Notify Backend
            await fetch(`http://localhost:3001/api/procurement/${workflowId}/confirm-payment`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ txHash: paymentTx.hash })
            });

            if (onPaymentSuccess) onPaymentSuccess();

        } catch (error: any) {
            console.error("Error executing payment:", error);
            alert(`Payment failed: ${error.message || "Unknown error"}`);
        } finally {
            setIsExecutingPayment(false);
        }
    };

    return (
        <div className="w-full bg-[#121821] border border-white/10 rounded-xl shadow-2xl overflow-hidden mt-8">
            <div className="px-5 py-4 border-b border-white/10 bg-white/5 flex items-center justify-between">
                <h2 className="text-xs font-mono font-bold text-white uppercase tracking-widest flex items-center gap-3">
                    <span className="text-slate-500">Workflow</span> #{workflowId}
                </h2>
                <div className="px-2 py-0.5 rounded bg-[var(--kinetic-teal)]/10 border border-[var(--kinetic-teal)]/30 text-[var(--kinetic-teal)] text-[10px] font-mono tracking-widest uppercase font-bold flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-[var(--kinetic-teal)] animate-pulse" />
                    Deep Transparency
                    <InfoTooltip content="Every state change, evaluation, and transaction is auditable on the blockchain." />
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

                        {status === "PaymentPending" && !isExecutingPayment && (
                            <div className="flex flex-col gap-2 p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/30">
                                <span className="text-[11px] font-mono text-yellow-500 uppercase tracking-widest font-bold">Action Required</span>
                                <p className="text-[10px] font-mono text-slate-300">The agent has selected a vendor. You must authorize the release of funds from your connected wallet to finalize the procurement.</p>
                                <button
                                    onClick={handleExecutePayment}
                                    className="mt-2 flex items-center justify-center gap-2 w-full py-2.5 bg-yellow-500 text-black font-bold font-mono text-[10px] uppercase tracking-widest rounded hover:bg-yellow-400 transition-colors relative"
                                >
                                    <CreditCard className="w-3.5 h-3.5" />
                                    <span>Approve & Execute Payment</span>
                                    <div className="absolute right-4 top-1/2 -translate-y-1/2">
                                        <InfoTooltip content="Allows the procurement agent to execute escrow payments within your defined budget." />
                                    </div>
                                </button>
                            </div>
                        )}

                        {isExecutingPayment && (
                            <div className="flex items-center justify-center gap-3 p-4 rounded-lg bg-[var(--kinetic-teal)]/10 border border-[var(--kinetic-teal)]/30">
                                <Loader2 className="w-4 h-4 text-[var(--kinetic-teal)] animate-spin" />
                                <span className="text-[10px] font-mono text-[var(--kinetic-teal)] uppercase tracking-widest font-bold animate-pulse">Waiting for Wallet Signature...</span>
                            </div>
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
