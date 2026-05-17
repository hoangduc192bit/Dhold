"use client";

import { useState } from "react";
import { useWallet } from "../../hooks/useWallet";
import { appKitEstimateSwap, appKitSwap, findTxHash, stringifyResult, TOKENS, TokenSymbol, resultExplorer } from "../../lib/circlekit";
import TiltCard from "../../components/TiltCard";
import CustomSelect from "../../components/CustomSelect";
import CircleKitWarning from "../../components/CircleKitWarning";

export default function SwapPage() {
  const { connected, connect, correctNetwork, switchNetwork } = useWallet();
  const [tokenIn, setTokenIn] = useState<TokenSymbol>("USDC");
  const [tokenOut, setTokenOut] = useState<TokenSymbol>("EURC");
  const [amountIn, setAmountIn] = useState("1.00");
  const [slippage, setSlippage] = useState("300");
  const [loading, setLoading] = useState<string | null>(null);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [sandboxMode, setSandboxMode] = useState(false);
  const [swapSuccess, setSwapSuccess] = useState(false);

  const hasKitKey = typeof window !== "undefined" && !!process.env.NEXT_PUBLIC_CIRCLE_KIT_KEY;

  async function run(kind: "estimate" | "swap") {
    setLoading(kind); 
    setError(null); 
    setResult(null);
    setSwapSuccess(false);
    try {
      if (sandboxMode && kind === "estimate") {
        // Mock Sandbox mode response for UI evaluation
        await new Promise((r) => setTimeout(r, 1000));
        const rateVal = tokenIn === "USDC" && tokenOut === "EURC" ? 0.9250 : tokenIn === "EURC" && tokenOut === "USDC" ? 1.0810 : 1.0;
        const mockAmountOut = (Number(amountIn || 0) * rateVal).toFixed(4);
        const mockFee = (Number(amountIn || 0) * 0.002).toFixed(4);
        
        setResult({
          amountIn,
          tokenIn,
          tokenOut,
          amountOut: mockAmountOut,
          fee: mockFee,
          rate: rateVal.toFixed(4),
          slippageBps: Number(slippage || 300),
          provider: "Circle Testnet Liquidity AMM",
          isSimulated: true
        });
        return;
      }

      if (kind === "swap" && !hasKitKey) {
        throw new Error("Cannot execute swap: Circle Kit Key is missing. Switch to Sandbox Mode for estimates only.");
      }

      const payload = { tokenIn, tokenOut, amountIn, slippageBps: Number(slippage || 300) };
      const res = kind === "estimate" ? await appKitEstimateSwap(payload) : await appKitSwap(payload);
      setResult(res);
      
      if (kind === "swap") {
        setSwapSuccess(true);
        import("canvas-confetti").then((confetti) => {
          confetti.default({
            particleCount: 150,
            spread: 70,
            origin: { y: 0.6 },
            colors: ['#FACC15', '#2DD4BF', '#F8FAFC']
          });
        });
      }
    } catch (e: unknown) {
      setError((e as { shortMessage?: string })?.shortMessage ?? (e as { message?: string })?.message ?? "Swap operation failed");
    } finally { 
      setLoading(null); 
    }
  }

  const explorer = resultExplorer(result);

  // Helper to extract values from real or simulated results safely
  const getExpectedOutput = () => {
    if (!result) return null;
    return result.amountOut ?? result.expectedAmount ?? result.targetAmount ?? null;
  };

  const getEstimatedFee = () => {
    if (!result) return null;
    return result.fee ?? result.networkFee ?? "0.00";
  };

  const getExchangeRate = () => {
    if (!result) return null;
    if (result.rate) return result.rate;
    const output = getExpectedOutput();
    if (output && amountIn) {
      return (Number(output) / Number(amountIn)).toFixed(4);
    }
    return null;
  };

  return (
    <div className="relative max-w-6xl mx-auto px-4 sm:px-6 py-14 overflow-hidden">
      <div className="flex flex-col items-center max-w-md mx-auto relative z-10">
        
        <section className="text-center mb-8 space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-gold/20 bg-gold/5 text-gold text-[11px] font-mono font-600 tracking-wider">
            APP KIT SWAP
          </div>
          <h1 className="font-display font-700 text-4xl text-text">Swap assets</h1>
          <p className="text-sub text-sm">Instant stablecoin swaps on Arc Testnet.</p>
        </section>

        {/* Custom Circle Kit Warning & Sandbox Coordinator */}
        <CircleKitWarning onSandboxToggle={setSandboxMode} />

        <TiltCard className="w-full p-6 sm:p-7 space-y-5">
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-display font-700 text-2xl text-text">Swap Terminal</h2>
            {sandboxMode && (
              <span className="badge border-yellow/30 bg-yellow/5 text-yellow">
                SIMULATION
              </span>
            )}
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-sub/70 mb-2">From</label>
              <CustomSelect 
                value={tokenIn} 
                onChange={(val) => {
                  setTokenIn(val as TokenSymbol);
                  setResult(null);
                }} 
                options={TOKENS.map(t => t.symbol)} 
              />
            </div>
            <div>
              <label className="block text-xs text-sub/70 mb-2">To</label>
              <CustomSelect 
                value={tokenOut} 
                onChange={(val) => {
                  setTokenOut(val as TokenSymbol);
                  setResult(null);
                }} 
                options={TOKENS.map(t => t.symbol)} 
              />
            </div>
          </div>

          <div>
            <label className="block text-xs text-sub/70 mb-2">Amount in</label>
            <input 
              className="input font-mono" 
              type="number" 
              min="0" 
              step="any" 
              value={amountIn} 
              onChange={e => {
                setAmountIn(e.target.value);
                setResult(null);
              }} 
            />
          </div>
          
          <div>
            <label className="block text-xs text-sub/70 mb-2">Slippage BPS</label>
            <input 
              className="input font-mono" 
              type="number" 
              value={slippage} 
              onChange={e => {
                setSlippage(e.target.value);
                setResult(null);
              }} 
            />
            <p className="text-xs text-sub/60 mt-1">300 BPS = 3%</p>
          </div>

          {!connected ? (
            <button onClick={connect} className="btn-gold w-full py-4 text-sm">Connect Wallet</button>
          ) : !correctNetwork ? (
            <button onClick={switchNetwork} className="btn-gold w-full py-4 text-sm">Switch to Arc Testnet</button>
          ) : (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <button 
                  onClick={() => run("estimate")} 
                  disabled={!!loading || !amountIn || (!hasKitKey && !sandboxMode)} 
                  className="btn-ghost py-4 text-sm disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {loading === "estimate" ? "Estimating..." : "Estimate"}
                </button>
                <button 
                  onClick={() => run("swap")} 
                  disabled={!!loading || !amountIn || tokenIn === tokenOut || !hasKitKey} 
                  className="btn-gold py-4 text-sm disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {loading === "swap" ? "Swapping..." : "Swap"}
                </button>
              </div>
              
              {!hasKitKey && sandboxMode && (
                <p className="text-[10px] text-yellow/70 text-center font-mono mt-1">
                  ⚠️ Action disabled: Real swaps require Circle Kit Key. Switch to Sandbox for mock estimates.
                </p>
              )}
            </div>
          )}

          {error && (
            <div className="rounded-2xl border border-red/30 bg-red/5 p-4 space-y-2">
              <p className="text-red text-sm font-semibold">Error Occurred</p>
              <p className="text-red/80 text-xs leading-relaxed">{error}</p>
            </div>
          )}

          {/* Premium Swap Quote Display Card */}
          {!!result && (
            <div className="space-y-4 animate-fade-up">
              {swapSuccess && (
                <div className="rounded-2xl border border-green/30 bg-green/5 p-5 text-center space-y-2">
                  <div className="w-10 h-10 mx-auto rounded-full bg-green/20 flex items-center justify-center text-green text-lg font-bold">✓</div>
                  <p className="text-green font-display font-700 text-xl">Swap Completed Successfully!</p>
                </div>
              )}
              <div className="rounded-2xl border border-gold/20 bg-gold/5 p-5 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-3">
                  {result.isSimulated ? (
                    <span className="text-[9px] font-mono font-bold tracking-wider px-2 py-0.5 rounded border border-yellow/20 bg-yellow/5 text-yellow">
                      SIMULATION ONLY
                    </span>
                  ) : (
                    <span className="text-[9px] font-mono font-bold tracking-wider px-2 py-0.5 rounded border border-green/20 bg-green/5 text-green">
                      LIVE QUOTE
                    </span>
                  )}
                </div>

                <p className="text-xs text-sub/70 font-mono">EXPECTED RECEIVE</p>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-3xl font-display font-800 text-text tabular">
                    {getExpectedOutput() ?? "—"}
                  </span>
                  <span className="text-lg font-display font-700 text-gold">{tokenOut}</span>
                </div>

                <div className="divider my-3" />

                <div className="grid grid-cols-2 gap-y-2.5 text-xs">
                  <span className="text-sub font-body">Exchange Rate</span>
                  <span className="text-text font-mono text-right">
                    1 {tokenIn} = {getExchangeRate() ?? "—"} {tokenOut}
                  </span>

                  <span className="text-sub font-body">Est. Network Fee</span>
                  <span className="text-text font-mono text-right">{getEstimatedFee()} {tokenIn}</span>

                  <span className="text-sub font-body">Slippage Limit</span>
                  <span className="text-text font-mono text-right">{slippage} BPS</span>
                </div>

                {explorer && (
                  <div className="mt-4 text-center">
                    <a href={explorer} target="_blank" rel="noopener noreferrer" className="inline-block px-4 py-2 rounded-full border border-gold/30 bg-gold/10 text-gold text-xs hover:bg-gold/20 transition-all font-display font-600">
                      View transaction ↗
                    </a>
                  </div>
                )}
              </div>

              {/* Collapsible Developer Json block */}
              <details className="group border border-border/80 rounded-2xl overflow-hidden bg-surface/50">
                <summary className="px-4 py-3 text-xs text-sub/80 cursor-pointer hover:text-text hover:bg-muted transition-colors flex items-center justify-between font-mono">
                  <span>Developer Quote Details (Raw Payload)</span>
                  <span className="text-[9px] transition-transform group-open:rotate-180">▼</span>
                </summary>
                <pre className="p-4 font-mono text-[10px] leading-relaxed text-sub/90 bg-black/30 overflow-x-auto border-t border-border/50 max-h-48 scrollbar">
                  {stringifyResult(result)}
                </pre>
              </details>
            </div>
          )}
        </TiltCard>
      </div>
    </div>
  );
}
