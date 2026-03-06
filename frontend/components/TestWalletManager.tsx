import { Wallet, KeySquare, Droplets, Coins } from "lucide-react";
import { useWallet, TEST_USDC_ADDRESS } from "@/context/WalletContext";
import { useState } from "react";
import { ethers } from "ethers";

export default function TestWalletManager() {
    const {
        address,
        isConnected,
        isCorrectNetwork,
        sfuelBalance,
        usdcBalance,
        signer,
        refreshBalances
    } = useWallet();

    const [isMinting, setIsMinting] = useState(false);

    const handleGetGas = () => {
        window.open("https://faucet.skale.network/", "_blank");
    };

    const handleMintUSDC = async () => {
        if (!signer || !address) {
            alert("Please connect your wallet first.");
            return;
        }

        try {
            setIsMinting(true);
            const usdcAbi = ["function mint(address to, uint256 amount) public"];
            const usdcContract = new ethers.Contract(TEST_USDC_ADDRESS, usdcAbi, signer);

            // Mint 10,000 USDC (6 decimals)
            const amount = ethers.parseUnits("10000", 6);

            console.log("Submitting mint transaction...");
            const tx = await usdcContract.mint(address, amount);
            console.log(`Transaction submitted: ${tx.hash}`);

            await tx.wait();
            console.log("Transaction confirmed!");

            await refreshBalances();
            alert("Successfully minted 10,000 Test USDC!");
        } catch (error: any) {
            console.error("Error minting USDC:", error);
            alert(`Failed to mint USDC: ${error.message || "Unknown error"}`);
        } finally {
            setIsMinting(false);
        }
    };

    return (
        <div className="w-full bg-[#121821] border border-yellow-500/30 rounded-xl shadow-2xl overflow-hidden relative group">
            {/* Subtle warning glow */}
            <div className="absolute inset-0 bg-yellow-500/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />

            <div className="px-5 py-3 border-b border-white/10 bg-white/5 flex items-center justify-between relative z-10">
                <h2 className="text-xs font-mono font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <Wallet className="w-3.5 h-3.5 text-yellow-500" />
                    Test Wallet Manager
                </h2>
                <span className="text-[9px] font-mono text-yellow-500 uppercase tracking-widest bg-yellow-500/10 px-2 py-0.5 rounded border border-yellow-500/20">
                    Testnet Utility
                </span>
            </div>

            <div className="p-6 space-y-5 relative z-10">
                <p className="text-[10px] font-mono text-slate-400 leading-relaxed">
                    Use your connected Web3 wallet to manage test funds. Get sFUEL for gas from the SKALE Faucet, and mint custom Test USDC to execute procurement transactions.
                </p>

                <div className="bg-[#0B0F14] border border-white/10 rounded-lg p-4 space-y-4">
                    <div className="flex justify-between items-center text-[10px] font-mono border-b border-white/10 pb-3">
                        <span className="text-slate-500 uppercase tracking-wider">Active Session Wallet</span>
                        <span className="text-[var(--kinetic-teal)] font-bold">
                            {isConnected ? `${address?.substring(0, 6)}...${address?.substring(address!.length - 4)}` : "Not Connected"}
                        </span>
                    </div>

                    <div className="flex gap-3">
                        <div className="flex-1 bg-white/5 rounded-md p-3 flex flex-col justify-center items-center border border-white/5 gap-1 shadow-inner">
                            <span className="text-[9px] text-slate-500 font-mono uppercase tracking-widest">sFUEL Balance</span>
                            <span className="text-sm font-mono text-[var(--kinetic-teal)]">
                                {isConnected ? parseFloat(sfuelBalance).toFixed(2) : "0.00"}
                            </span>
                        </div>
                        <div className="flex-1 bg-white/5 rounded-md p-3 flex flex-col justify-center items-center border border-white/5 gap-1 shadow-inner">
                            <span className="text-[9px] text-slate-500 font-mono uppercase tracking-widest">USDC Balance</span>
                            <span className="text-sm font-mono text-[var(--cyber-lime)] border-b border-[var(--cyber-lime)]/30">
                                {isConnected ? parseFloat(usdcBalance).toFixed(2) : "0.00"}
                            </span>
                        </div>
                    </div>
                </div>

                <div className="flex gap-3">
                    <button
                        onClick={handleGetGas}
                        className="flex-1 py-3 bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-lg text-[10px] font-mono font-bold uppercase tracking-widest transition-colors flex justify-center items-center gap-2"
                    >
                        <Droplets className="w-3.5 h-3.5 text-blue-400" />
                        Get sFUEL Gas
                    </button>

                    <button
                        onClick={handleMintUSDC}
                        disabled={!isConnected || !isCorrectNetwork || isMinting}
                        className={`flex-1 py-3 rounded-lg text-[10px] font-mono font-bold uppercase tracking-widest transition-colors flex justify-center items-center gap-2
                            ${(!isConnected || !isCorrectNetwork) ? 'bg-slate-800 text-slate-500 cursor-not-allowed' :
                                isMinting ? 'bg-yellow-500/50 text-black cursor-wait' :
                                    'bg-yellow-500 hover:bg-yellow-400 text-black shadow-[0_0_15px_rgba(234,179,8,0.2)]'
                            }`}
                    >
                        <Coins className="w-3.5 h-3.5" />
                        {isMinting ? "Minting..." : "Mint Test USDC"}
                    </button>
                </div>
            </div>
        </div>
    );
}
