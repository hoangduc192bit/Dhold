"use client";

import { useState } from "react";
import { useWallet } from "../../hooks/useWallet";
import { appKitEstimateSwap, appKitSwap, findTxHash, stringifyResult, TOKENS, TokenSymbol, resultExplorer } from "../../lib/circlekit";
import TiltCard from "../../components/TiltCard";
import CustomSelect from "../../components/CustomSelect";

export default function SwapPage() {
  const { connected, connect, correctNetwork, switchNetwork } = useWallet();
  const [tokenIn, setTokenIn] = useState<TokenSymbol>("USDC");
  const [tokenOut, setTokenOut] = useState<TokenSymbol>("EURC");
  const [amountIn, setAmountIn] = useState("1.00");
  const [slippage, setSlippage] = useState("300");
  const [loading, setLoading] = useState<string | null>(null);
  const [result, setResult] = useState<unknown>(null);
  const [error, setError] = useState<string | null>(null);

  async function run(kind: "estimate" | "swap") {
    setLoading(kind); setError(null); setResult(null);
    try {
      const payload = { tokenIn, tokenOut, amountIn, slippageBps: Number(slippage || 300) };
      const res = kind === "estimate" ? await appKitEstimateSwap(payload) : await appKitSwap(payload);
      setResult(res);
    } catch (e: unknown) {
      setError((e as { shortMessage?: string })?.shortMessage ?? (e as { message?: string })?.message ?? "Swap failed");
    } finally { setLoading(null); }
  }

  const explorer = resultExplorer(result);
  const hasKitKey = !!process.env.NEXT_PUBLIC_CIRCLE_KIT_KEY;

  return (
    <div className="relative max-w-6xl mx-auto px-4 sm:px-6 py-14 overflow-hidden">
      <div className="flex flex-col items-center max-w-md mx-auto relative z-10">
        <section className="text-center mb-8 space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-gold/20 bg-gold/5 text-gold text-[11px] font-mono font-600">APP KIT SWAP</div>
          <h1 className="font-display font-700 text-4xl text-text">Swap assets</h1>
          <p className="text-sub text-sm">Instant stablecoin swaps on Arc Testnet.</p>
          {!hasKitKey && (
            <div className="rounded-xl border border-yellow/30 bg-yellow/5 p-3 text-yellow text-xs">
              ⚠️ Cần Circle Kit Key (lấy tại developers.circle.com).
            </div>
          )}
        </section>

        <TiltCard className="w-full p-6 sm:p-7 space-y-5">
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-display font-700 text-2xl text-text">Swap Terminal</h2>
            <span className="badge bg-gold/10 border border-gold/20 text-gold">Arc</span>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-sub/70 mb-2">From</label>
              <CustomSelect 
                value={tokenIn} 
                onChange={(val) => setTokenIn(val as TokenSymbol)} 
                options={TOKENS.map(t => t.symbol)} 
              />
            </div>
            <div>
              <label className="block text-xs text-sub/70 mb-2">To</label>
              <CustomSelect 
                value={tokenOut} 
                onChange={(val) => setTokenOut(val as TokenSymbol)} 
                options={TOKENS.map(t => t.symbol)} 
              />
            </div>
          </div>

          <div>
            <label className="block text-xs text-sub/70 mb-2">Amount in</label>
            <input className="input font-mono" type="number" min="0" step="any" value={amountIn} onChange={e => setAmountIn(e.target.value)} />
          </div>
          <div>
            <label className="block text-xs text-sub/70 mb-2">Slippage BPS</label>
            <input className="input font-mono" type="number" value={slippage} onChange={e => setSlippage(e.target.value)} />
            <p className="text-xs text-sub/60 mt-1">300 BPS = 3%</p>
          </div>

          {!connected ? <button onClick={connect} className="btn-gold w-full py-4 text-sm">Connect Wallet</button> : !correctNetwork ? <button onClick={switchNetwork} className="btn-gold w-full py-4 text-sm">Switch to Arc Testnet</button> : (
            <div className="grid grid-cols-2 gap-3">
              <button onClick={() => run("estimate")} disabled={!!loading || !amountIn} className="btn-ghost py-4 text-sm">{loading === "estimate" ? "Estimating..." : "Estimate"}</button>
              <button onClick={() => run("swap")} disabled={!!loading || !amountIn || tokenIn === tokenOut} className="btn-gold py-4 text-sm">{loading === "swap" ? "Swapping..." : "Swap"}</button>
            </div>
          )}

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
                <p className="text-sm text-sub">Estimate successful.</p>
              )}
            </div>
          )}
        </TiltCard>
      </div>
    </div>
  );
}
