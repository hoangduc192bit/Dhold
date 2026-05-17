"use client";

import { useState } from "react";
import { useWallet } from "../../hooks/useWallet";
import { appKitBridge, BRIDGE_CHAINS, resultExplorer, stringifyResult } from "../../lib/circlekit";
import TiltCard from "../../components/TiltCard";
import CustomSelect from "../../components/CustomSelect";

export default function BridgePage() {
  const { connected, connect } = useWallet();
  const [fromChain, setFromChain] = useState("Base_Sepolia");
  const [toChain, setToChain] = useState("Arc_Testnet");
  const [amount, setAmount] = useState("1.00");
  const [forwarder, setForwarder] = useState(true);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<unknown>(null);
  const [error, setError] = useState<string | null>(null);

  async function bridge() {
    setLoading(true); setError(null); setResult(null);
    try {
      const res = await appKitBridge({ fromChain, toChain, amount, useForwarder: forwarder });
      setResult(res);
    } catch (e: unknown) {
      setError((e as { shortMessage?: string })?.shortMessage ?? (e as { message?: string })?.message ?? "Bridge failed");
    } finally { setLoading(false); }
  }

  const explorer = resultExplorer(result);
  const hasKitKey = !!process.env.NEXT_PUBLIC_CIRCLE_KIT_KEY;

  return (
    <div className="relative max-w-6xl mx-auto px-4 sm:px-6 py-14 overflow-hidden">
      <div className="flex flex-col items-center max-w-md mx-auto relative z-10">
        <section className="text-center mb-8 space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-gold/20 bg-gold/5 text-gold text-[11px] font-mono font-600">CCTP BRIDGE</div>
          <h1 className="font-display font-700 text-4xl text-text">Bridge USDC</h1>
          <p className="text-sub text-sm">Seamlessly transfer USDC across networks to Arc Testnet.</p>
          {!hasKitKey && (
            <div className="rounded-xl border border-yellow/30 bg-yellow/5 p-3 text-yellow text-xs">
              ⚠️ Cần Circle Kit Key (lấy tại developers.circle.com).
            </div>
          )}
        </section>

        <TiltCard className="w-full p-6 sm:p-7 space-y-5">
          <h2 className="font-display font-700 text-2xl text-text">Bridge Terminal</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-sub/70 mb-2">From chain</label>
              <CustomSelect value={fromChain} onChange={setFromChain} options={BRIDGE_CHAINS} />
            </div>
            <div>
              <label className="block text-xs text-sub/70 mb-2">To chain</label>
              <CustomSelect value={toChain} onChange={setToChain} options={BRIDGE_CHAINS} />
            </div>
          </div>
          <div>
            <label className="block text-xs text-sub/70 mb-2">Amount USDC</label>
            <input className="input font-mono" type="number" min="0" step="any" value={amount} onChange={e => setAmount(e.target.value)} />
          </div>
          <label className="flex items-center justify-between rounded-2xl border border-border bg-surface px-4 py-3 cursor-pointer">
            <span className="text-sm text-text">Use Forwarding Service</span>
            <input type="checkbox" checked={forwarder} onChange={e => setForwarder(e.target.checked)} />
          </label>

          {!connected ? <button onClick={connect} className="btn-gold w-full py-4 text-sm">Connect Wallet</button> : <button onClick={bridge} disabled={loading || !amount || fromChain === toChain} className="btn-gold w-full py-4 text-sm">{loading ? "Bridging..." : "Bridge USDC"}</button>}

          {error && <div className="rounded-2xl border border-red/30 bg-red/5 p-4 text-red text-sm">{error}</div>}
          {!!result && (
            <div className="rounded-2xl border border-green/30 bg-green/5 p-5 text-center space-y-2">
              <div className="w-10 h-10 mx-auto rounded-full bg-green/20 flex items-center justify-center text-green text-lg">✓</div>
              <p className="text-green font-display font-700 text-lg">Done!</p>
              {explorer ? (
                <a href={explorer} target="_blank" rel="noopener noreferrer" className="inline-block mt-2 px-4 py-2 rounded-full border border-gold/30 bg-gold/10 text-gold text-sm hover:bg-gold/20 transition-colors">
                  View transaction ↗
                </a>
              ) : (
                <p className="text-sm text-sub">Bridge request successful.</p>
              )}
            </div>
          )}
        </TiltCard>
      </div>
    </div>
  );
}
