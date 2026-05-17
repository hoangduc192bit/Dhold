"use client";
import { useState, useEffect, useCallback, createContext, useContext, ReactNode } from "react";
import { formatEther } from "viem";
import { arcTestnet, pub } from "../lib/contract";

const ARC_ID = 5042002;

interface WalletCtx {
  address: `0x${string}` | null;
  connected: boolean;
  correctNetwork: boolean;
  balance: string;
  connecting: boolean;
  connect: () => Promise<void>;
  switchNetwork: () => Promise<void>;
}

const Ctx = createContext<WalletCtx | null>(null);

export function WalletProvider({ children }: { children: ReactNode }) {
  const [address, setAddress] = useState<`0x${string}` | null>(null);
  const [correctNetwork, setCorrectNetwork] = useState(false);
  const [balance, setBalance] = useState("0");
  const [connecting, setConnecting] = useState(false);

  const refresh = useCallback(async () => {
    if (!window.ethereum) return;
    try {
      const accounts = await window.ethereum.request({ method: "eth_accounts" }) as string[];
      if (!accounts?.length) { setAddress(null); return; }
      const addr = accounts[0] as `0x${string}`;
      setAddress(addr);
      const chainId = parseInt(await window.ethereum.request({ method: "eth_chainId" }) as string, 16);
      const ok = chainId === ARC_ID;
      setCorrectNetwork(ok);
      if (ok) {
        const bal = await pub().getBalance({ address: addr });
        setBalance(parseFloat(formatEther(bal)).toFixed(4));
      }
    } catch {}
  }, []);

  useEffect(() => {
    refresh();
    if (!window.ethereum) return;
    window.ethereum.on("accountsChanged", refresh);
    window.ethereum.on("chainChanged", refresh);
    return () => { window.ethereum?.removeListener("accountsChanged", refresh); window.ethereum?.removeListener("chainChanged", refresh); };
  }, [refresh]);

  const switchNetwork = useCallback(async () => {
    if (!window.ethereum) return;
    const hex = "0x" + ARC_ID.toString(16);
    try {
      await window.ethereum.request({ method: "wallet_switchEthereumChain", params: [{ chainId: hex }] });
    } catch (e: unknown) {
      if ((e as { code?: number })?.code === 4902) {
        await window.ethereum.request({ method: "wallet_addEthereumChain", params: [{ chainId: hex, chainName: arcTestnet.name, nativeCurrency: arcTestnet.nativeCurrency, rpcUrls: [arcTestnet.rpcUrls.default.http[0]], blockExplorerUrls: [arcTestnet.blockExplorers.default.url] }] });
      }
    }
    await refresh();
  }, [refresh]);

  const connect = useCallback(async () => {
    if (!window.ethereum) { alert("Install MetaMask or Rabby wallet first!"); return; }
    setConnecting(true);
    try {
      await window.ethereum.request({ method: "eth_requestAccounts" });
      await switchNetwork();
      await refresh();
    } finally { setConnecting(false); }
  }, [refresh, switchNetwork]);

  return <Ctx.Provider value={{ address, connected: !!address, correctNetwork, balance, connecting, connect, switchNetwork }}>{children}</Ctx.Provider>;
}

export const useWallet = () => { const c = useContext(Ctx); if (!c) throw new Error("useWallet must be inside WalletProvider"); return c; };
