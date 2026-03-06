"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { ethers } from "ethers";

// SKALE Base Sepolia Testnet Configuration
const SKALE_NETWORK = {
    chainId: "0x5109f0df", // 1359647359 in hex
    chainName: "SKALE Base Sepolia Testnet",
    nativeCurrency: {
        name: "sFUEL",
        symbol: "sFUEL",
        decimals: 18,
    },
    rpcUrls: ["https://testnet.skalenodes.com/v1/base-sepolia"],
    blockExplorerUrls: ["https://base-sepolia.skalenodes.com/"],
};

// Known custom USDC on this testnet
// (Update this if your deployment uses a different address)
export const TEST_USDC_ADDRESS = "0xeD65d83643722e03038CDA69DdeC6bdeCea9D31B";

export interface WalletContextState {
    address: string | null;
    isConnected: boolean;
    isCorrectNetwork: boolean;
    sfuelBalance: string;
    usdcBalance: string;
    signer: ethers.Signer | null;
    provider: ethers.BrowserProvider | null;
    connectWallet: () => Promise<void>;
    disconnectWallet: () => void;
    switchNetwork: () => Promise<void>;
    refreshBalances: () => Promise<void>;
}

const WalletContext = createContext<WalletContextState | undefined>(undefined);

export function WalletProvider({ children }: { children: ReactNode }) {
    const [address, setAddress] = useState<string | null>(null);
    const [isConnected, setIsConnected] = useState(false);
    const [isCorrectNetwork, setIsCorrectNetwork] = useState(false);
    const [sfuelBalance, setSfuelBalance] = useState("0");
    const [usdcBalance, setUsdcBalance] = useState("0");
    const [signer, setSigner] = useState<ethers.Signer | null>(null);
    const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null);

    // Check if wallet is already connected on mount
    useEffect(() => {
        checkConnection();

        if (window.ethereum) {
            window.ethereum.on("accountsChanged", handleAccountsChanged);
            window.ethereum.on("chainChanged", handleChainChanged);
        }

        return () => {
            if (window.ethereum) {
                window.ethereum.removeListener("accountsChanged", handleAccountsChanged);
                window.ethereum.removeListener("chainChanged", handleChainChanged);
            }
        };
    }, []);

    const handleAccountsChanged = (accounts: string[]) => {
        if (accounts.length === 0) {
            disconnectWallet();
        } else {
            setAddress(accounts[0]);
            setIsConnected(true);
            checkNetworkAndBalances(accounts[0]);
        }
    };

    const handleChainChanged = (chainId: string) => {
        setIsCorrectNetwork(chainId === SKALE_NETWORK.chainId);
        if (chainId === SKALE_NETWORK.chainId && address) {
            checkNetworkAndBalances(address);
        }
    };

    const checkConnection = async () => {
        if (window.ethereum) {
            try {
                const browserProvider = new ethers.BrowserProvider(window.ethereum);
                const accounts = await browserProvider.listAccounts();
                if (accounts.length > 0) {
                    const userAddress = accounts[0].address;
                    setAddress(userAddress);
                    setIsConnected(true);
                    setProvider(browserProvider);
                    const userSigner = await browserProvider.getSigner();
                    setSigner(userSigner);
                    await checkNetworkAndBalances(userAddress);
                }
            } catch (error) {
                console.error("Error checking wallet connection:", error);
            }
        }
    };

    const checkNetworkAndBalances = async (userAddress: string) => {
        if (!window.ethereum) return;

        try {
            const browserProvider = new ethers.BrowserProvider(window.ethereum);
            setProvider(browserProvider);

            const network = await browserProvider.getNetwork();
            // stringify chainId to hex for comparison
            const hexChainId = "0x" + network.chainId.toString(16);
            const correct = hexChainId === SKALE_NETWORK.chainId;
            setIsCorrectNetwork(correct);

            const userSigner = await browserProvider.getSigner();
            setSigner(userSigner);

            if (correct) {
                await fetchBalances(browserProvider, userAddress);
            } else {
                setSfuelBalance("0");
                setUsdcBalance("0");
            }
        } catch (error) {
            console.error("Error checking network/balances:", error);
        }
    };

    const fetchBalances = async (browserProvider: ethers.BrowserProvider, userAddress: string) => {
        try {
            // Fetch sFUEL (native ETH)
            const balance = await browserProvider.getBalance(userAddress);
            setSfuelBalance(ethers.formatEther(balance));

            // Fetch Custom USDC
            const usdcAbi = ["function balanceOf(address owner) view returns (uint256)"];
            const usdcContract = new ethers.Contract(TEST_USDC_ADDRESS, usdcAbi, browserProvider);
            const usdcBal = await usdcContract.balanceOf(userAddress);
            setUsdcBalance(ethers.formatUnits(usdcBal, 6)); // USDC typically has 6 decimals
        } catch (error) {
            console.error("Error fetching balances:", error);
        }
    };

    const refreshBalances = async () => {
        if (provider && address && isCorrectNetwork) {
            await fetchBalances(provider, address);
        }
    };

    const connectWallet = async () => {
        if (!window.ethereum) {
            alert("Please install MetaMask to use this feature.");
            return;
        }

        try {
            const browserProvider = new ethers.BrowserProvider(window.ethereum);
            await browserProvider.send("eth_requestAccounts", []);
            const userSigner = await browserProvider.getSigner();
            const userAddress = await userSigner.getAddress();

            setProvider(browserProvider);
            setSigner(userSigner);
            setAddress(userAddress);
            setIsConnected(true);

            await checkNetworkAndBalances(userAddress);

            // Auto switch if wrong network
            if (!isCorrectNetwork) {
                await switchNetwork();
            }
        } catch (error) {
            console.error("Error connecting wallet:", error);
        }
    };

    const disconnectWallet = () => {
        setAddress(null);
        setIsConnected(false);
        setIsCorrectNetwork(false);
        setSfuelBalance("0");
        setUsdcBalance("0");
        setSigner(null);
    };

    const switchNetwork = async () => {
        if (!window.ethereum) return;
        try {
            await window.ethereum.request({
                method: "wallet_switchEthereumChain",
                params: [{ chainId: SKALE_NETWORK.chainId }],
            });
        } catch (error: any) {
            // This error code means the chain has not been added to MetaMask
            if (error.code === 4902) {
                try {
                    await window.ethereum.request({
                        method: "wallet_addEthereumChain",
                        params: [SKALE_NETWORK],
                    });
                } catch (addError) {
                    console.error("Error adding SKALE network:", addError);
                }
            } else {
                console.error("Error switching network:", error);
            }
        }
    };

    return (
        <WalletContext.Provider
            value={{
                address,
                isConnected,
                isCorrectNetwork,
                sfuelBalance,
                usdcBalance,
                signer,
                provider,
                connectWallet,
                disconnectWallet,
                switchNetwork,
                refreshBalances
            }}
        >
            {children}
        </WalletContext.Provider>
    );
}

export function useWallet() {
    const context = useContext(WalletContext);
    if (context === undefined) {
        throw new Error("useWallet must be used within a WalletProvider");
    }
    return context;
}
