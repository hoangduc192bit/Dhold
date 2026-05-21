"use client";
import { useState, useEffect, useCallback, createContext, useContext, ReactNode } from "react";
import { formatEther } from "viem";
import { arcTestnet, pub } from "../lib/contract";

const ARC_ID = 5042002;

export const CHAIN_METADATA: Record<number, {
  chainId: string;
  chainName: string;
  nativeCurrency: { name: string; symbol: string; decimals: number };
  rpcUrls: string[];
  blockExplorerUrls: string[];
}> = {
  5042002: {
    chainId: "0x4cef52",
    chainName: "Arc Testnet",
    nativeCurrency: { name: "USDC", symbol: "USDC", decimals: 18 },
    rpcUrls: ["https://rpc.testnet.arc.network"],
    blockExplorerUrls: ["https://testnet.arcscan.app"]
  },
  84532: {
    chainId: "0x14a34",
    chainName: "Base Sepolia",
    nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
    rpcUrls: ["https://sepolia.base.org"],
    blockExplorerUrls: ["https://sepolia.basescan.org"]
  },
  11155111: {
    chainId: "0xaa36a7",
    chainName: "Sepolia Test Network",
    nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
    rpcUrls: ["https://rpc.sepolia.org"],
    blockExplorerUrls: ["https://sepolia.etherscan.io"]
  },
  421614: {
    chainId: "0x66eee",
    chainName: "Arbitrum Sepolia",
    nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
    rpcUrls: ["https://sepolia-rollup.arbitrum.io/rpc"],
    blockExplorerUrls: ["https://sepolia.arbiscan.io"]
  },
  11155420: {
    chainId: "0xab48c0",
    chainName: "Optimism Sepolia",
    nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
    rpcUrls: ["https://sepolia.optimism.io"],
    blockExplorerUrls: ["https://sepolia-optimism.etherscan.io"]
  },
  80002: {
    chainId: "0x13882",
    chainName: "Polygon Amoy Testnet",
    nativeCurrency: { name: "POL", symbol: "POL", decimals: 18 },
    rpcUrls: ["https://rpc-amoy.polygon.technology"],
    blockExplorerUrls: ["https://amoy.polygonscan.com"]
  },
  43113: {
    chainId: "0xa869",
    chainName: "Avalanche Fuji Testnet",
    nativeCurrency: { name: "AVAX", symbol: "AVAX", decimals: 18 },
    rpcUrls: ["https://api.avax-test.network/ext/bc/C/rpc"],
    blockExplorerUrls: ["https://testnet.snowtrace.io"]
  }
};

interface WalletCtx {
  address: `0x${string}` | null;
  connected: boolean;
  correctNetwork: boolean;
  chainId: number | null;
  balance: string;
  connecting: boolean;
  connect: () => Promise<void>;
  switchNetwork: () => Promise<void>;
  switchNetworkTo: (targetId: number) => Promise<void>;
}

const Ctx = createContext<WalletCtx | null>(null);

export function WalletProvider({ children }: { children: ReactNode }) {
  const [address, setAddress] = useState<`0x${string}` | null>(null);
  const [correctNetwork, setCorrectNetwork] = useState(false);
  const [chainId, setChainId] = useState<number | null>(null);
  const [balance, setBalance] = useState("0");
  const [connecting, setConnecting] = useState(false);

  const refresh = useCallback(async () => {
    if (!window.ethereum) return;
    try {
      const accounts = await window.ethereum.request({ method: "eth_accounts" }) as string[];
      if (!accounts?.length) { 
        setAddress(null); 
        setChainId(null);
        return; 
      }
      const addr = accounts[0] as `0x${string}`;
      setAddress(addr);
      const chainIdHex = await window.ethereum.request({ method: "eth_chainId" }) as string;
      const cId = parseInt(chainIdHex, 16);
      setChainId(cId);
      const ok = cId === ARC_ID;
      setCorrectNetwork(ok);
      if (ok) {
        const bal = await pub().getBalance({ address: addr });
        setBalance(parseFloat(formatEther(bal)).toFixed(4));
      } else {
        setBalance("0");
      }
    } catch {
      setAddress(null);
      setChainId(null);
    }
  }, []);

  useEffect(() => {
    refresh();
    if (!window.ethereum) return;
    window.ethereum.on("accountsChanged", refresh);
    window.ethereum.on("chainChanged", refresh);
    return () => { 
      window.ethereum?.removeListener("accountsChanged", refresh); 
      window.ethereum?.removeListener("chainChanged", refresh); 
    };
  }, [refresh]);

  const switchNetworkTo = useCallback(async (targetId: number) => {
    if (!window.ethereum) return;
    const details = CHAIN_METADATA[targetId];
    if (!details) return;
    try {
      await window.ethereum.request({ method: "wallet_switchEthereumChain", params: [{ chainId: details.chainId }] });
    } catch (e: unknown) {
      if ((e as { code?: number })?.code === 4902) {
        await window.ethereum.request({ 
          method: "wallet_addEthereumChain", 
          params: [{
            chainId: details.chainId,
            chainName: details.chainName,
            nativeCurrency: details.nativeCurrency,
            rpcUrls: details.rpcUrls,
            blockExplorerUrls: details.blockExplorerUrls
          }] 
        });
      }
    }
    await refresh();
  }, [refresh]);

  const switchNetwork = useCallback(async () => {
    await switchNetworkTo(ARC_ID);
  }, [switchNetworkTo]);

  const connect = useCallback(async () => {
    if (!window.ethereum) { alert("Install MetaMask or Rabby wallet first!"); return; }
    setConnecting(true);
    try {
      await window.ethereum.request({ method: "eth_requestAccounts" });
      await switchNetwork();
      await refresh();
    } finally { setConnecting(false); }
  }, [refresh, switchNetwork]);

  return (
    <Ctx.Provider value={{ address, connected: !!address, correctNetwork, chainId, balance, connecting, connect, switchNetwork, switchNetworkTo }}>
      {children}
    </Ctx.Provider>
  );
}

export const useWallet = () => { 
  const c = useContext(Ctx); 
  if (!c) throw new Error("useWallet must be inside WalletProvider"); 
  return c; 
};
