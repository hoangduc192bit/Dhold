"use client";

import { useState } from "react";
import { useWallet } from "../../hooks/useWallet";

export default function FaucetPage() {
  const { address, connected, connect, balance } = useWallet();
  const [copied, setCopied] = useState(false);

  async function copyAddress() {
    if (!address) return;
    await navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div className="relative max-w-5xl mx-auto px-4 sm:px-6 py-16 overflow-hidden">
      <div className="animated-blob right-0 top-10" />
      <div className="grid lg:grid-cols-[1.05fr_.95fr] gap-6 items-stretch">
        <div className="card p-8 sm:p-10 space-y-6 relative overflow-hidden">
          <div className="absolute -right-20 -top-20 w-56 h-56 rounded-full bg-gold/10 blur-3xl" />
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-gold/20 bg-gold/5 text-gold text-xs font-body font-600">
            <span>🚰</span> Circle Official Faucet
          </div>
          <div>
            <h1 className="font-display font-800 text-4xl sm:text-5xl text-text leading-tight mb-4">Get Arc Testnet USDC</h1>
            <p className="text-sub font-body text-lg max-w-xl">Use Circle’s official faucet to fund your wallet for ArcBounty jobs, payment links, swap and bridge testing.</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <a href="https://faucet.circle.com/" target="_blank" rel="noopener noreferrer" className="btn-gold px-7 py-4 text-sm text-center">Open Circle Faucet ↗</a>
            {connected && address ? <button onClick={copyAddress} className="btn-ghost px-7 py-4 text-sm">{copied ? "Copied wallet!" : "Copy Wallet"}</button> : <button onClick={connect} className="btn-ghost px-7 py-4 text-sm">Connect Wallet</button>}
          </div>
          <p className="text-xs text-sub/60 font-body">On Circle Faucet, choose Arc Testnet, paste your wallet address, then request testnet USDC.</p>
        </div>

        <div className="card p-6 sm:p-8 space-y-5">
          <h2 className="font-display font-700 text-2xl text-text">Wallet checkpoint</h2>
          {connected && address ? (
            <>
              <div className="rounded-2xl border border-border bg-surface p-4">
                <p className="text-xs text-sub/60 mb-2">Connected wallet</p>
                <p className="font-mono text-sm text-text break-all">{address}</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-2xl border border-gold/15 bg-gold/5 p-4">
                  <p className="text-xs text-sub/60 mb-1">Native USDC</p>
                  <p className="font-display font-700 text-2xl text-gold">{balance}</p>
                </div>
                <div className="rounded-2xl border border-border bg-surface p-4">
                  <p className="text-xs text-sub/60 mb-1">Network</p>
                  <p className="font-body font-700 text-text">Arc Testnet</p>
                </div>
              </div>
            </>
          ) : (
            <div className="rounded-2xl border border-border bg-surface p-5 text-center space-y-4">
              <p className="text-sub text-sm">Connect wallet first to copy your address faster.</p>
              <button onClick={connect} className="btn-gold px-6 py-3 text-sm">Connect Wallet</button>
            </div>
          )}

          <div className="space-y-3">
            {["Open Circle Faucet", "Select Arc Testnet", "Paste wallet address", "Request testnet USDC"].map((x, i) => (
              <div key={x} className="flex items-center gap-3 rounded-2xl border border-border bg-surface px-4 py-3">
                <span className="w-7 h-7 rounded-full bg-gold/10 border border-gold/20 text-gold text-xs font-mono flex items-center justify-center">{i + 1}</span>
                <span className="text-sm text-text font-body">{x}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
