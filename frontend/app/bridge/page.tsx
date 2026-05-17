"use client";

import { useState } from "react";
import { useWallet } from "../../hooks/useWallet";
import { appKitBridge, appKitEstimateBridge, BRIDGE_CHAINS, resultExplorer, stringifyResult } from "../../lib/circlekit";
import TiltCard from "../../components/TiltCard";
import CustomSelect from "../../components/CustomSelect";
import CircleKitWarning from "../../components/CircleKitWarning";

export default function BridgePage() {
  const { connected, connect } = useWallet();
  const [fromChain, setFromChain] = useState("Base_Sepolia");
  const [toChain, setToChain] = useState("Arc_Testnet");
  const [amount, setAmount] = useState("1.00");
  const [forwarder, setForwarder] = useState(true);
  const [loading, setLoading] = useState<string | null>(null);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [sandboxMode, setSandboxMode] = useState(false);

  const hasKitKey = typeof window !== "undefined" && !!process.env.NEXT_PUBLIC_CIRCLE_KIT_KEY;

  async function run(kind: "estimate" | "bridge") {
    setLoading(kind); 
    setError(null); 
    setResult(null);
    try {
      if (sandboxMode && kind === "estimate") {
        // Mock Sandbox mode response for UI evaluation
        await new Promise((r) => setTimeout(r, 1000));
        setResult({
          amount,
          fromChain,
          toChain,
          token: "USDC",
          destinationAmount: amount,
          fee: (Number(amount || 0) * 0.005).toFixed(4),
          gasEstimate: "0.00015 ETH",
          estimatedMinutes: fromChain === "Ethereum_Sepolia" ? "3-5" : "1-2",
          provider: "Circle CCTP Bridge Kit",
          isSimulated: true
        });
        return;
      }

      if (kind === "bridge" && !hasKitKey) {
        throw new Error("Cannot execute bridge: Circle Kit Key is missing. Switch to Sandbox Mode for estimates only.");
      }

      if (kind === "estimate") {
        const res = await appKitEstimateBridge({ fromChain, toChain, amount, useForwarder: forwarder });
        setResult(res);
      } else {
        const res = await appKitBridge({ fromChain, toChain, amount, useForwarder: forwarder });
        setResult(res);
      }
    } catch (e: unknown) {
      setError((e as { shortMessage?: string })?.shortMessage ?? (e as { message?: string })?.message ?? "Bridge operation failed");
    } finally { 
      setLoading(null); 
    }
  }

  const explorer = resultExplorer(result);

  // Helper to extract values safely
  const getExpectedOutput = () => {
    if (!result) return null;
    return result.destinationAmount ?? result.targetAmount ?? result.amountOut ?? amount;
  };

  const getEstimatedFee = () => {
    if (!result) return null;
    return result.fee ?? result.networkFee ?? "0.00";
  };

  const getEstimatedGas = () => {
    if (!result) return null;
    return result.gasEstimate ?? result.estimatedGas ?? "Free (Forwarded)";
  };

  const getProcessingTime = () => {
    if (!result) return null;
    return result.estimatedMinutes ?? "2-3 mins (CCTP)";
  };

  return (
    <div className="relative max-w-6xl mx-auto px-4 sm:px-6 py-14 overflow-hidden">
      <div className="flex flex-col items-center max-w-md mx-auto relative z-10">
        
        <section className="text-center mb-8 space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-gold/20 bg-gold/5 text-gold text-[11px] font-mono font-600 tracking-wider">
            CCTP BRIDGE
          </div>
          <h1 className="font-display font-700 text-4xl text-text">Bridge USDC</h1>
          <p className="text-sub text-sm">Seamlessly transfer USDC across networks to Arc Testnet.</p>
        </section>

        {/* Circle Kit Warning Component with Sandbox mode toggle */}
        <CircleKitWarning onSandboxToggle={setSandboxMode} />

        <TiltCard className="w-full p-6 sm:p-7 space-y-5">
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-display font-700 text-2xl text-text">Bridge Terminal</h2>
            {sandboxMode && (
              <span className="badge border-yellow/30 bg-yellow/5 text-yellow">
                SIMULATION
              </span>
            )}
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-sub/70 mb-2">From chain</label>
              <CustomSelect 
                value={fromChain} 
                onChange={(val) => {
                  setFromChain(val);
                  setResult(null);
                }} 
                options={BRIDGE_CHAINS} 
              />
            </div>
            <div>
              <label className="block text-xs text-sub/70 mb-2">To chain</label>
              <CustomSelect 
                value={toChain} 
                onChange={(val) => {
                  setToChain(val);
                  setResult(null);
                }} 
                options={BRIDGE_CHAINS} 
              />
            </div>
          </div>
          
          <div>
            <label className="block text-xs text-sub/70 mb-2">Amount USDC</label>
            <input 
              className="input font-mono" 
              type="number" 
              min="0" 
              step="any" 
              value={amount} 
              onChange={e => {
                setAmount(e.target.value);
                setResult(null);
              }} 
            />
          </div>
          
          <label className="flex items-center justify-between rounded-2xl border border-border bg-surface px-4 py-3 cursor-pointer select-none">
            <span className="text-sm text-text font-body">Use Forwarding Service</span>
            <input 
              type="checkbox" 
              className="rounded bg-black border-border text-gold focus:ring-0 w-4 h-4 cursor-pointer"
              checked={forwarder} 
              onChange={e => {
                setForwarder(e.target.checked);
                setResult(null);
              }} 
            />
          </label>

          {!connected ? (
            <button onClick={connect} className="btn-gold w-full py-4 text-sm">Connect Wallet</button>
          ) : (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <button 
                  onClick={() => run("estimate")} 
                  disabled={!!loading || !amount || fromChain === toChain || (!hasKitKey && !sandboxMode)} 
                  className="btn-ghost py-4 text-sm disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {loading === "estimate" ? "Estimating..." : "Estimate"}
                </button>
                <button 
                  onClick={() => run("bridge")} 
                  disabled={!!loading || !amount || fromChain === toChain || !hasKitKey} 
                  className="btn-gold py-4 text-sm disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {loading === "bridge" ? "Bridging..." : "Bridge USDC"}
                </button>
              </div>
              
              {!hasKitKey && sandboxMode && (
                <p className="text-[10px] text-yellow/70 text-center font-mono mt-1">
                  ⚠️ Action disabled: Real bridging requires Circle Kit Key. Switch to Sandbox for mock estimates.
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

          {/* Premium Bridge Quote Display Card */}
          {!!result && (
            <div className="space-y-4 animate-fade-up">
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

                <p className="text-xs text-sub/70 font-mono">ESTIMATED OUTPUT ON RECEIVER</p>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-3xl font-display font-800 text-text tabular">
                    {getExpectedOutput()}
                  </span>
                  <span className="text-lg font-display font-700 text-gold">USDC</span>
                </div>

                <div className="divider my-3" />

                <div className="grid grid-cols-2 gap-y-2.5 text-xs">
                  <span className="text-sub font-body">Bridge Protocol</span>
                  <span className="text-text font-mono text-right">{result.provider ?? "Circle CCTP"}</span>

                  <span className="text-sub font-body">Est. Relayer Fee</span>
                  <span className="text-text font-mono text-right">{getEstimatedFee()} USDC</span>

                  <span className="text-sub font-body">Gas Cost (Source)</span>
                  <span className="text-text font-mono text-right">{getEstimatedGas()}</span>

                  <span className="text-sub font-body">Processing Duration</span>
                  <span className="text-text font-mono text-right font-medium text-gold/90">{getProcessingTime()} mins</span>
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
