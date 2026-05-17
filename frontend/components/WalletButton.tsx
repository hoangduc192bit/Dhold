"use client";
import { useWallet } from "../hooks/useWallet";
import { shortAddr } from "../lib/contract";

export default function WalletButton() {
  const { address, connected, correctNetwork, balance, connecting, connect, switchNetwork } = useWallet();

  if (connecting) return (
    <button className="flex items-center gap-2 px-4 py-2 rounded-xl bg-surface border border-border text-sub text-sm font-body cursor-wait">
      <div className="w-3.5 h-3.5 border-2 border-gold/30 border-t-gold rounded-full spin" />
      Connecting…
    </button>
  );

  if (connected && !correctNetwork) return (
    <button onClick={switchNetwork} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red/10 border border-red/30 text-red text-sm font-body font-500 hover:bg-red/15 transition-all">
      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
      Wrong Network
    </button>
  );

  if (connected && address) return (
    <div className="flex items-center gap-2">
      <div className="hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-xl bg-surface border border-border">
        <span className="text-xs text-sub font-body">{balance}</span>
        <span className="text-xs text-gold font-body font-500">USDC</span>
      </div>
      <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-gold/8 border border-gold/20">
        <div className="w-2 h-2 rounded-full bg-gold dot-pulse" />
        <span className="text-sm text-gold font-mono font-500">{shortAddr(address)}</span>
      </div>
    </div>
  );

  return (
    <button onClick={connect} className="btn-gold px-5 py-2.5 text-sm">
      Connect Wallet
    </button>
  );
}
