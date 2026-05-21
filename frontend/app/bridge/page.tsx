"use client";

import { useState, useEffect } from "react";
import { useWallet } from "../../hooks/useWallet";
import { appKitBridge, appKitEstimateBridge, BRIDGE_CHAINS, resultExplorer, stringifyResult } from "../../lib/circlekit";
import TiltCard from "../../components/TiltCard";
import CustomSelect from "../../components/CustomSelect";
import CircleKitWarning from "../../components/CircleKitWarning";

interface Step {
  name: string;
  state: "idle" | "pending" | "success" | "error" | "failed";
  txHash?: string;
  error?: string;
  data?: {
    explorerUrl?: string;
    txHash?: string;
  };
}

interface BridgeResult {
  state: "pending" | "success" | "error";
  steps: Step[];
  isSimulated?: boolean;
}

interface Receipt {
  timestamp: number;
  fromChain: string;
  toChain: string;
  amount: string;
  state: string;
  steps: Step[];
  isSimulated: boolean;
}

const BRIDGE_CHAIN_IDS: Record<string, number> = {
  "Arc_Testnet": 5042002,
  "Ethereum_Sepolia": 11155111,
  "Base_Sepolia": 84532,
  "Arbitrum_Sepolia": 421614,
  "Optimism_Sepolia": 11155420,
  "Polygon_Amoy": 80002,
  "Avalanche_Fuji": 43113,
};

const BRIDGE_CHAIN_EXPLORERS: Record<string, string> = {
  "Arc_Testnet": "https://testnet.arcscan.app",
  "Ethereum_Sepolia": "https://sepolia.etherscan.io",
  "Base_Sepolia": "https://sepolia.basescan.org",
  "Arbitrum_Sepolia": "https://sepolia.arbiscan.io",
  "Optimism_Sepolia": "https://sepolia-optimism.etherscan.io",
  "Polygon_Amoy": "https://amoy.polygonscan.com",
  "Avalanche_Fuji": "https://testnet.snowtrace.io",
};

export default function BridgePage() {
  const { connected, connect, chainId, switchNetworkTo } = useWallet();
  const [fromChain, setFromChain] = useState("Base_Sepolia");
  const [toChain, setToChain] = useState("Arc_Testnet");
  const [amount, setAmount] = useState("1.00");
  const [forwarder, setForwarder] = useState(true);
  const [loading, setLoading] = useState<string | null>(null);
  const [result, setResult] = useState<any>(null); // Holds either Quote or BridgeResult
  const [error, setError] = useState<string | null>(null);
  const [sandboxMode, setSandboxMode] = useState(false);
  const [receipts, setReceipts] = useState<Receipt[]>([]);

  const requiredChainId = BRIDGE_CHAIN_IDS[fromChain] || 0;
  const isCorrectSourceChain = chainId === requiredChainId;

  const hasKitKey = typeof window !== "undefined" && !!process.env.NEXT_PUBLIC_CIRCLE_KIT_KEY;

  // Load receipts from localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("arc_bridge_receipts");
      if (saved) {
        try {
          setReceipts(JSON.parse(saved));
        } catch (e) {
          console.error("Failed to parse receipts history:", e);
        }
      }
    }
  }, []);

  const saveReceipt = (newReceipt: Receipt) => {
    setReceipts((prev) => {
      const updated = [newReceipt, ...prev].slice(0, 50); // limit to last 50 receipts
      const safeString = JSON.stringify(updated, (_, value) => typeof value === "bigint" ? value.toString() : value);
      localStorage.setItem("arc_bridge_receipts", safeString);
      return updated;
    });
  };

  const clearHistory = () => {
    localStorage.removeItem("arc_bridge_receipts");
    setReceipts([]);
  };

  async function run(kind: "estimate" | "bridge") {
    setLoading(kind); 
    setError(null); 
    setResult(null);
    try {
      if (kind === "estimate") {
        if (sandboxMode) {
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

        const res = await appKitEstimateBridge({ fromChain, toChain, amount, useForwarder: forwarder });
        setResult(res);
        return;
      }

      // kind === "bridge"
      if (sandboxMode) {
        // Simulated Sandbox Bridge Progress
        const initialResult: BridgeResult = {
          state: "pending",
          isSimulated: true,
          steps: [
            { name: "approve", state: "pending" },
            { name: "burn", state: "idle" },
            { name: "fetchAttestation", state: "idle" },
            { name: "mint", state: "idle" },
          ],
        };
        setResult(initialResult);
        
        const steps = [...initialResult.steps];
        const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
        
        // Step 1: approve
        await sleep(1500);
        steps[0] = {
          name: "approve",
          state: "success",
          txHash: "0xe56b9c9f7a8b8c2d1e0f9a8b7c6d5e4f3a2b1c0d9e8f7a6b5c4d3e2f1a0b9c8d",
          data: {
            explorerUrl: fromChain === "Arc_Testnet" 
              ? `https://testnet.arcscan.app/tx/0xe56b9c9f7a8b8c2d1e0f9a8b7c6d5e4f3a2b1c0d9e8f7a6b5c4d3e2f1a0b9c8d` 
              : `https://sepolia.etherscan.io/tx/0xe56b9c9f7a8b8c2d1e0f9a8b7c6d5e4f3a2b1c0d9e8f7a6b5c4d3e2f1a0b9c8d`
          }
        };
        steps[1].state = "pending";
        setResult({ state: "pending", steps: [...steps], isSimulated: true });
        
        // Step 2: burn
        await sleep(1500);
        steps[1] = {
          name: "burn",
          state: "success",
          txHash: "0xa8b7c6d5e4f3a2b1c0d9e8f7a6b5c4d3e2f1a0b9c8de56b9c9f7a8b8c2d1e0f9",
          data: {
            explorerUrl: fromChain === "Arc_Testnet" 
              ? `https://testnet.arcscan.app/tx/0xa8b7c6d5e4f3a2b1c0d9e8f7a6b5c4d3e2f1a0b9c8de56b9c9f7a8b8c2d1e0f9` 
              : `https://sepolia.etherscan.io/tx/0xa8b7c6d5e4f3a2b1c0d9e8f7a6b5c4d3e2f1a0b9c8de56b9c9f7a8b8c2d1e0f9`
          }
        };
        steps[2].state = "pending";
        setResult({ state: "pending", steps: [...steps], isSimulated: true });
        
        // Step 3: fetchAttestation
        await sleep(2000);
        steps[2] = {
          name: "fetchAttestation",
          state: "success",
          txHash: undefined,
          data: {}
        };
        steps[3].state = "pending";
        setResult({ state: "pending", steps: [...steps], isSimulated: true });
        
        // Step 4: mint
        await sleep(1500);
        steps[3] = {
          name: "mint",
          state: "success",
          txHash: "0x1a0b9c8de56b9c9f7a8b8c2d1e0f9a8b7c6d5e4f3a2b1c0d9e8f7a6b5c4d3e2f",
          data: {
            explorerUrl: toChain === "Arc_Testnet" 
              ? `https://testnet.arcscan.app/tx/0x1a0b9c8de56b9c9f7a8b8c2d1e0f9a8b7c6d5e4f3a2b1c0d9e8f7a6b5c4d3e2f` 
              : `https://sepolia.etherscan.io/tx/0x1a0b9c8de56b9c9f7a8b8c2d1e0f9a8b7c6d5e4f3a2b1c0d9e8f7a6b5c4d3e2f`
          }
        };
        const finalSimResult: BridgeResult = { state: "success", steps: [...steps], isSimulated: true };
        setResult(finalSimResult);
        console.log("Bridge result:", finalSimResult);
        
        // Save to Receipt History
        saveReceipt({
          timestamp: Date.now(),
          fromChain,
          toChain,
          amount,
          state: "success",
          steps: finalSimResult.steps,
          isSimulated: true
        });
        return;
      }

      // Real Bridge Mode
      if (!hasKitKey) {
        throw new Error("Cannot execute bridge: Circle Kit Key is missing. Switch to Sandbox Mode to simulate bridging.");
      }

      const res = await appKitBridge({ fromChain, toChain, amount, useForwarder: forwarder });
      console.log("Bridge result:", res);
      
      const finalState = res?.state ?? "success";
      const steps = res?.steps ?? [];
      
      const finalResult: BridgeResult = {
        state: finalState,
        steps: steps.map((s: any) => ({
          name: s.name,
          state: s.state,
          txHash: s.txHash ?? s.data?.txHash ?? s.data?.transactionHash ?? s.data?.hash ?? "",
          error: s.error ?? null,
          data: s.data ?? {}
        }))
      };
      
      setResult(finalResult);
      
      // Save to Receipt History
      saveReceipt({
        timestamp: Date.now(),
        fromChain,
        toChain,
        amount,
        state: finalState,
        steps: finalResult.steps,
        isSimulated: false
      });

    } catch (e: unknown) {
      console.error("Bridge failed:", e);
      const errMsg = (e as { shortMessage?: string })?.shortMessage ?? (e as { message?: string })?.message ?? "Bridge operation failed";
      setError(errMsg);

      // Save failed result in Receipt History if there are steps
      const finalResult: BridgeResult = {
        state: "error",
        steps: [
          { name: "approve", state: "error", error: errMsg }
        ]
      };
      setResult(finalResult);

      saveReceipt({
        timestamp: Date.now(),
        fromChain,
        toChain,
        amount,
        state: "error",
        steps: finalResult.steps,
        isSimulated: sandboxMode
      });
    } finally { 
      setLoading(null); 
    }
  }

  // Helper to extract values safely (for estimates / quotes)
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

  // Helper to render step status icons
  const getStepIcon = (state: string) => {
    switch (state) {
      case "success":
        return (
          <span className="w-6 h-6 rounded-full bg-green/20 border border-green text-green flex items-center justify-center font-bold text-xs shrink-0">
            ✓
          </span>
        );
      case "pending":
        return (
          <span className="w-6 h-6 rounded-full bg-gold/20 border border-gold text-gold flex items-center justify-center font-bold text-xs shrink-0 animate-pulse">
            ●
          </span>
        );
      case "error":
      case "failed":
        return (
          <span className="w-6 h-6 rounded-full bg-red/20 border border-red text-red flex items-center justify-center font-bold text-xs shrink-0">
            ✗
          </span>
        );
      default:
        return (
          <span className="w-6 h-6 rounded-full bg-border border border-sub/30 text-sub/50 flex items-center justify-center font-bold text-xs shrink-0">
            ○
          </span>
        );
    }
  };

  // Helper to render the direct explorer link securely based on rules
  const renderExplorerLink = (step: Step) => {
    const txHash = step.txHash || (step.data as any)?.txHash || (step.data as any)?.transactionHash || (step.data as any)?.hash;
    if (!txHash) return null;

    const stepChain = (step.name === "mint") ? toChain : fromChain;
    const explorerBase = BRIDGE_CHAIN_EXPLORERS[stepChain];
    if (!explorerBase) return null;

    const url = `${explorerBase}/tx/${txHash}`;
    const isArcExplorer = url.toLowerCase().includes("arcscan") || url.toLowerCase().includes("arc.network");
    
    if (isArcExplorer) {
      return (
        <a href={url} target="_blank" rel="noopener noreferrer" className="text-gold hover:text-gold-dim underline text-xs font-mono transition-colors">
          View on Arcscan ↗
        </a>
      );
    } else {
      return (
        <a href={url} target="_blank" rel="noopener noreferrer" className="text-cyan hover:text-cyan/80 underline text-xs font-mono transition-colors">
          View on Explorer ↗
        </a>
      );
    }
  };

  return (
    <div className="relative max-w-6xl mx-auto px-4 sm:px-6 py-14 overflow-hidden">
      <div className="flex flex-col items-center max-w-lg mx-auto relative z-10">
        
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
          ) : !sandboxMode && !isCorrectSourceChain ? (
            <button 
              onClick={() => switchNetworkTo(requiredChainId)}
              className="btn-gold w-full py-4 text-sm font-semibold flex items-center justify-center gap-2 hover:brightness-110 transition-all active:scale-[0.98]"
            >
              🔄 Switch Wallet to {fromChain.replace("_", " ")}
            </button>
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
                  disabled={!!loading || !amount || fromChain === toChain || (!hasKitKey && !sandboxMode)} 
                  className="btn-gold py-4 text-sm disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {loading === "bridge" ? "Bridging..." : "Bridge USDC"}
                </button>
              </div>
              
              {!hasKitKey && sandboxMode && (
                <p className="text-[10px] text-yellow/70 text-center font-mono mt-1">
                  💡 Sandbox Mode: Simulated bridging is enabled. Real bridging requires Kit Key.
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

          {/* Active Bridge Step Progress Tracker */}
          {result && result.steps && (
            <div className="rounded-2xl border border-gold/20 bg-gold/5 p-5 space-y-4 animate-fade-up">
              <div className="flex items-center justify-between border-b border-gold/10 pb-3">
                <span className="text-xs font-mono font-bold tracking-wider text-sub/70 uppercase">
                  Active Bridge Progress
                </span>
                {result.isSimulated && (
                  <span className="text-[9px] font-mono font-bold tracking-wider px-2 py-0.5 rounded border border-yellow/20 bg-yellow/5 text-yellow">
                    SIMULATED
                  </span>
                )}
              </div>

              {/* Steps timeline display */}
              <div className="space-y-4">
                {result.steps.map((step: Step, idx: number) => (
                  <div key={idx} className="flex gap-4 items-start">
                    <div className="flex flex-col items-center">
                      {getStepIcon(step.state)}
                      {idx < result.steps.length - 1 && (
                        <div className={`w-0.5 h-10 my-1 ${
                          step.state === "success" ? "bg-green/50" : "bg-border/30"
                        }`} />
                      )}
                    </div>
                    <div className="flex-1 min-w-0 pt-0.5">
                      <div className="flex justify-between items-center gap-2">
                        <p className="text-sm font-display font-semibold text-text capitalize">
                          {step.name === "fetchAttestation" ? "Fetch Attestation" : step.name}
                        </p>
                        <span className={`text-[10px] font-mono font-medium px-2 py-0.5 rounded capitalize ${
                          step.state === "success" ? "bg-green/10 text-green border border-green/15" :
                          step.state === "pending" ? "bg-gold/10 text-gold border border-gold/15" :
                          step.state === "error" || step.state === "failed" ? "bg-red/10 text-red border border-red/15" :
                          "bg-surface text-sub/60 border border-border"
                        }`}>
                          {step.state}
                        </span>
                      </div>

                      {step.txHash && (
                        <p className="text-xs font-mono text-sub/70 mt-1 truncate">
                          Tx Hash: <span className="text-text/90 font-mono">{step.txHash.slice(0, 10)}...{step.txHash.slice(-10)}</span>
                        </p>
                      )}

                      {step.error && (
                        <p className="text-xs text-red font-mono mt-1 font-medium bg-red/5 px-2 py-1 rounded border border-red/15">
                          ⚠️ {step.error}
                        </p>
                      )}

                      <div className="mt-1.5 flex gap-2">
                        {renderExplorerLink(step)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Status Message summary based on result.state */}
              <div className="border-t border-gold/10 pt-4 mt-3 space-y-3">
                <div className="flex items-center gap-2">
                  <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                    result.state === "success" ? "bg-green" :
                    result.state === "pending" ? "bg-gold animate-ping" :
                    "bg-red"
                  }`} />
                  <p className="text-sm font-semibold text-text">
                    {result.state === "pending" && "Bridge pending / waiting for attestation or mint"}
                    {result.state === "success" && "Bridge completed"}
                    {result.state === "error" && `Bridge failed at ${result.steps.find((s: Step) => s.state === "error" || s.state === "failed")?.name ?? "unknown step"}`}
                  </p>
                </div>

                {result.state === "error" && (
                  <button 
                    onClick={() => run("bridge")} 
                    className="btn-gold w-full py-2 text-xs font-semibold mt-1"
                  >
                    Retry Bridge
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Premium Bridge Quote Display Card (for estimates only, i.e., no steps present) */}
          {result && !result.steps && (
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

        {/* Premium Receipt History Component */}
        <div className="w-full mt-10 space-y-4">
          <div className="flex justify-between items-center px-1">
            <h3 className="font-display font-700 text-xl text-text flex items-center gap-2">
              📜 Receipt History
            </h3>
            {receipts.length > 0 && (
              <button 
                onClick={clearHistory}
                className="text-xs text-sub/60 hover:text-red hover:underline transition-colors font-body"
              >
                Clear History
              </button>
            )}
          </div>

          {receipts.length === 0 ? (
            <div className="rounded-2xl border border-border bg-surface/30 p-8 text-center">
              <span className="text-2xl block mb-2">📬</span>
              <p className="text-sm text-sub font-body">No bridge receipt history found.</p>
              <p className="text-xs text-sub/60 font-body mt-1">Completed transactions will be saved here automatically.</p>
            </div>
          ) : (
            <div className="space-y-3.5 w-full">
              {receipts.map((rcpt: Receipt, index: number) => (
                <details 
                  key={index}
                  className="group border border-border/80 rounded-2xl overflow-hidden bg-card/40 hover:bg-card/60 transition-colors"
                >
                  <summary className="px-5 py-4 cursor-pointer select-none flex items-center justify-between gap-3 text-sm">
                    <div className="flex items-center gap-3">
                      <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                        rcpt.state === "success" ? "bg-green" :
                        rcpt.state === "pending" ? "bg-gold animate-pulse" :
                        "bg-red"
                      }`} />
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono font-bold text-text">{rcpt.amount} USDC</span>
                          <span className="text-xs text-sub/70 font-mono">
                            {rcpt.fromChain.split("_")[0]} → {rcpt.toChain.split("_")[0]}
                          </span>
                        </div>
                        <span className="text-[10px] text-sub/50 block font-mono mt-0.5">
                          {new Date(rcpt.timestamp).toLocaleString()}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {rcpt.isSimulated && (
                        <span className="text-[8px] font-mono font-bold tracking-wider px-1.5 py-0.5 rounded border border-yellow/20 bg-yellow/5 text-yellow uppercase">
                          Sim
                        </span>
                      )}
                      <span className="text-[10px] transition-transform group-open:rotate-180 text-sub">
                        ▼
                      </span>
                    </div>
                  </summary>

                  <div className="px-5 pb-5 pt-1 border-t border-border/40 bg-black/10 space-y-4">
                    {/* Collapsed Step Details inside history */}
                    <div className="space-y-3 pt-3">
                      {rcpt.steps.map((st: Step, sIdx: number) => (
                        <div key={sIdx} className="flex gap-3 items-start text-xs">
                          {getStepIcon(st.state)}
                          <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-center gap-2">
                              <span className="font-body font-semibold text-text capitalize">
                                {st.name === "fetchAttestation" ? "Fetch Attestation" : st.name}
                              </span>
                              <span className={`font-mono text-[9px] capitalize ${
                                st.state === "success" ? "text-green" :
                                st.state === "pending" ? "text-gold" :
                                st.state === "error" || st.state === "failed" ? "text-red" :
                                "text-sub"
                              }`}>
                                {st.state}
                              </span>
                            </div>
                            
                            {st.txHash && (
                              <p className="font-mono text-[10px] text-sub/60 mt-0.5 truncate">
                                Tx: {st.txHash.slice(0, 12)}...{st.txHash.slice(-12)}
                              </p>
                            )}

                            {st.error && (
                              <p className="font-mono text-[10px] text-red mt-0.5 bg-red/5 p-1 rounded">
                                Error: {st.error}
                              </p>
                            )}

                            <div className="mt-1 flex gap-2">
                              {renderExplorerLink(st)}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </details>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
