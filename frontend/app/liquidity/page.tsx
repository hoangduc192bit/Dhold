"use client";

import { useEffect, useState, useRef } from "react";
import { useWallet } from "../../hooks/useWallet";
import { readTokenBalance, TOKENS, TokenSymbol } from "../../lib/circlekit";
import TiltCard from "../../components/TiltCard";
import CustomSelect from "../../components/CustomSelect";
import Link from "next/link";

export default function LiquidityPage() {
  const { connected, connect, address, correctNetwork, switchNetwork } = useWallet();
  const [usdcBalance, setUsdcBalance] = useState("0.00");
  const [eurcBalance, setEurcBalance] = useState("0.00");
  const [loadingBalances, setLoadingBalances] = useState(false);

  // Form states
  const [amountUsdc, setAmountUsdc] = useState("10.00");
  const [amountEurc, setAmountEurc] = useState("9.25");
  const [isDepositSingle, setIsDepositSingle] = useState(false);
  const [withdrawPercent, setWithdrawPercent] = useState(50);
  const [activeTab, setActiveTab] = useState<"add" | "remove">("add");

  // Simulated LP state (persisted in localStorage)
  const [lpBalance, setLpBalance] = useState(0); // in simulated LP units
  const [accruedFees, setAccruedFees] = useState(0); // in simulated USD value

  // Animation states
  const [stepLoading, setStepLoading] = useState<string | null>(null);
  const [stepMessage, setStepMessage] = useState("");
  const [txSuccess, setTxSuccess] = useState(false);
  const [txError, setTxError] = useState<string | null>(null);

  const yieldInterval = useRef<NodeJS.Timeout | null>(null);

  // Load balances from connected wallet on Arc Testnet
  useEffect(() => {
    async function loadBalances() {
      if (!connected || !address) return;
      setLoadingBalances(true);
      try {
        const uBal = await readTokenBalance(address, "USDC");
        const eBal = await readTokenBalance(address, "EURC");
        setUsdcBalance(Number(uBal).toFixed(2));
        setEurcBalance(Number(eBal).toFixed(2));
      } catch (err) {
        console.error("Failed to read testnet balances", err);
      } finally {
        setLoadingBalances(false);
      }
    }
    loadBalances();
  }, [connected, address]);

  // Load simulated LP position from localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedLp = localStorage.getItem("arc_simulated_lp_balance");
      const savedFees = localStorage.getItem("arc_simulated_lp_fees");
      if (savedLp) setLpBalance(Number(savedLp));
      if (savedFees) setAccruedFees(Number(savedFees));
    }
  }, []);

  // Yield accrual simulation (accumulates +$0.000002 simulated fee yield every 3.5 seconds if LP > 0)
  useEffect(() => {
    if (lpBalance > 0) {
      yieldInterval.current = setInterval(() => {
        setAccruedFees((prev) => {
          const next = prev + 0.000002;
          localStorage.setItem("arc_simulated_lp_fees", String(next));
          return next;
        });
      }, 3500);
    } else {
      if (yieldInterval.current) clearInterval(yieldInterval.current);
    }

    return () => {
      if (yieldInterval.current) clearInterval(yieldInterval.current);
    };
  }, [lpBalance]);

  // Balanced pool deposit logic: 1 USDC = 0.925 EURC
  const handleUsdcChange = (val: string) => {
    setAmountUsdc(val);
    if (!isDepositSingle && val && !isNaN(Number(val))) {
      setAmountEurc((Number(val) * 0.925).toFixed(4));
    }
  };

  const handleEurcChange = (val: string) => {
    setAmountEurc(val);
    if (!isDepositSingle && val && !isNaN(Number(val))) {
      setAmountUsdc((Number(val) / 0.925).toFixed(4));
    }
  };

  // Add simulated liquidity transaction sequence
  const executeAddLiquidity = async () => {
    setStepLoading("add");
    setTxSuccess(false);
    setTxError(null);

    const usdcToDeposit = Number(amountUsdc || 0);
    const eurcToDeposit = Number(amountEurc || 0);

    try {
      setStepMessage("1/4 Approving USDC token allowance...");
      await new Promise((r) => setTimeout(r, 1200));

      setStepMessage("2/4 Approving EURC token allowance...");
      await new Promise((r) => setTimeout(r, 1000));

      setStepMessage("3/4 Injecting liquidity into simulated AMM contract...");
      await new Promise((r) => setTimeout(r, 1500));

      setStepMessage("4/4 Minting simulated LP shares (USDC-EURC-LP)...");
      await new Promise((r) => setTimeout(r, 1000));

      // Calculate simulated new LP balance (1 LP share per $10 deposited)
      const addedLp = (usdcToDeposit + eurcToDeposit * 1.08) / 10;
      const nextLp = lpBalance + addedLp;
      setLpBalance(nextLp);
      localStorage.setItem("arc_simulated_lp_balance", String(nextLp));

      setTxSuccess(true);
    } catch (err: any) {
      setTxError(err.message || "Simulated transaction failed");
    } finally {
      setStepLoading(null);
    }
  };

  // Remove simulated liquidity transaction sequence
  const executeRemoveLiquidity = async () => {
    setStepLoading("remove");
    setTxSuccess(false);
    setTxError(null);

    try {
      setStepMessage("1/3 Initiating withdrawal Request...");
      await new Promise((r) => setTimeout(r, 1000));

      setStepMessage("2/3 Unlocking pooled USDC and EURC contracts...");
      await new Promise((r) => setTimeout(r, 1200));

      setStepMessage("3/3 Dispensing assets & burning LP shares...");
      await new Promise((r) => setTimeout(r, 1000));

      // Calculate reduction
      const multiplier = (100 - withdrawPercent) / 100;
      const nextLp = lpBalance * multiplier;
      setLpBalance(nextLp);
      localStorage.setItem("arc_simulated_lp_balance", String(nextLp));

      // Reset accrued fees simulation
      const nextFees = accruedFees * multiplier;
      setAccruedFees(nextFees);
      localStorage.setItem("arc_simulated_lp_fees", String(nextFees));

      setTxSuccess(true);
    } catch (err: any) {
      setTxError(err.message || "Simulated withdrawal failed");
    } finally {
      setStepLoading(null);
    }
  };

  // Simulated Position Metrics
  const simulatedPooledUsdc = (lpBalance * 5.0).toFixed(2);
  const simulatedPooledEurc = (lpBalance * 4.625).toFixed(2);
  const poolSharePercent = lpBalance > 0 ? (lpBalance / 245089 * 100).toFixed(5) : "0.00000";

  return (
    <div className="relative max-w-6xl mx-auto px-4 sm:px-6 py-14 overflow-hidden">
      
      {/* 3D animated blur background blobs for premium aesthetic */}
      <div className="absolute top-1/4 left-1/3 w-80 h-80 bg-cyan/5 rounded-full filter blur-[80px] pointer-events-none animate-spin-slow" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-gold/5 rounded-full filter blur-[100px] pointer-events-none animate-pulse-gold" />

      <div className="flex flex-col items-center max-w-3xl mx-auto relative z-10 space-y-8">
        
        {/* Page Header */}
        <section className="text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-cyan/20 bg-cyan/5 text-cyan text-[11px] font-mono font-600 tracking-wider">
            LIQUIDITY HUB
          </div>
          <h1 className="font-display font-800 text-4xl sm:text-5xl text-text tracking-tight">
            AMM Liquidity Pools
          </h1>
          <p className="text-sub text-sm max-w-lg mx-auto leading-relaxed">
            Provide stablecoin liquidity to earn trading fees passive yield.
          </p>
          
          {/* Constrained warning badge clearly declaring demo mode */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border border-yellow/20 bg-yellow/5 text-yellow text-xs font-medium max-w-md mx-auto">
            <span>⚙️</span>
            <span className="font-mono text-[11px] text-left">
              <strong>DEMO MODE / FUTURE AMM:</strong> LP position & yield simulation are cached locally in the browser for UI prototyping. Real pool contracts are under development.
            </span>
          </div>
        </section>

        {/* Analytics Section */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full">
          <div className="card p-5 border border-border bg-card/40 flex flex-col justify-between">
            <span className="text-[10px] font-mono font-bold tracking-wider text-sub/70 uppercase">Total TVL</span>
            <span className="text-2xl font-display font-800 text-text mt-2 tabular">$2,450,890</span>
            <span className="text-[9px] text-green font-mono mt-1 font-semibold">+12.4% (7d)</span>
          </div>
          
          <div className="card p-5 border border-border bg-card/40 flex flex-col justify-between">
            <span className="text-[10px] font-mono font-bold tracking-wider text-sub/70 uppercase">Expected APR</span>
            <span className="text-2xl font-display font-800 text-gold mt-2 tabular">8.45%</span>
            <span className="text-[9px] text-sub/60 font-mono mt-1">Simulated projection</span>
          </div>

          <div className="card p-5 border border-border bg-card/40 flex flex-col justify-between">
            <span className="text-[10px] font-mono font-bold tracking-wider text-sub/70 uppercase">Volume (24h)</span>
            <span className="text-2xl font-display font-800 text-text mt-2 tabular">$482,100</span>
            <span className="text-[9px] text-cyan font-mono mt-1 font-semibold">1,024 trades</span>
          </div>

          <div className="card p-5 border border-border bg-card/40 flex flex-col justify-between">
            <span className="text-[10px] font-mono font-bold tracking-wider text-sub/70 uppercase">User Share</span>
            <span className="text-2xl font-display font-800 text-text mt-2 tabular">
              {poolSharePercent}%
            </span>
            <span className="text-[9px] text-sub/60 font-mono mt-1">
              {lpBalance.toFixed(2)} LP units
            </span>
          </div>
        </div>

        {/* Dual Layout: Position Panel and Action Terminal */}
        <div className="grid md:grid-cols-12 gap-6 w-full items-start">
          
          {/* Active simulated LP position display */}
          <div className="md:col-span-5 space-y-6">
            <TiltCard className="p-6 space-y-5">
              <h3 className="font-display font-700 text-lg text-text">Simulated Position</h3>
              
              {lpBalance > 0 ? (
                <div className="space-y-4">
                  <div className="p-4 rounded-2xl bg-surface border border-gold/15 bg-gold/5 text-center">
                    <span className="text-[10px] font-mono text-sub/80 block uppercase">Accumulated LP yield fees</span>
                    <span className="text-3xl font-mono font-bold text-gold tracking-tight block mt-1 tabular">
                      ${accruedFees.toFixed(6)}
                    </span>
                    <span className="text-[9px] font-mono text-green/90 block mt-1 animate-pulse font-semibold">
                      ● Accumulating Yield Real-time
                    </span>
                  </div>

                  <div className="space-y-2.5 text-xs">
                    <div className="flex justify-between">
                      <span className="text-sub font-body">LP Token Balance</span>
                      <span className="text-text font-mono">{lpBalance.toFixed(4)} USDC-EURC-LP</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sub font-body">Pooled USDC</span>
                      <span className="text-text font-mono font-medium">{simulatedPooledUsdc} USDC</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sub font-body">Pooled EURC</span>
                      <span className="text-text font-mono font-medium">{simulatedPooledEurc} EURC</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sub font-body">Share of pool</span>
                      <span className="text-text font-mono">{poolSharePercent}%</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-6 px-4 border border-dashed border-border rounded-2xl space-y-3">
                  <span className="text-3xl block">📥</span>
                  <span className="block text-sm font-semibold text-text">No Liquidity Deposited</span>
                  <p className="text-xs text-sub/70 leading-relaxed max-w-xs mx-auto">
                    Provide stablecoins to the pool using the terminal to see simulated earnings and pool share metrics.
                  </p>
                </div>
              )}
            </TiltCard>

            {/* Quick Action Navigation shortcuts */}
            <div className="card p-5 border border-border bg-card/30 space-y-3">
              <span className="text-xs font-semibold text-text block">Need USDC or EURC?</span>
              <p className="text-xs text-sub/70 leading-relaxed">
                You can claim free USDC/EURC stablecoins directly on Arc Testnet, or bridge assets from Sepolia.
              </p>
              <div className="grid grid-cols-2 gap-2.5 pt-1">
                <Link href="/faucet" className="btn-ghost py-2 text-center text-xs font-semibold font-display">
                  Claim Faucet ↗
                </Link>
                <Link href="/bridge" className="btn-ghost py-2 text-center text-xs font-semibold font-display">
                  Bridge USDC ↗
                </Link>
              </div>
            </div>
          </div>

          {/* Deposit and Withdrawal Actions panel */}
          <div className="md:col-span-7 card border border-border p-6 sm:p-7 space-y-6">
            
            {/* Tab select buttons */}
            <div className="flex border-b border-border/60 pb-1">
              <button 
                onClick={() => { setActiveTab("add"); setTxSuccess(false); setTxError(null); }}
                className={`flex-1 pb-3 text-sm font-display font-700 border-b-2 transition-all ${
                  activeTab === "add" 
                    ? "border-gold text-gold" 
                    : "border-transparent text-sub hover:text-text"
                }`}
              >
                Deposit Assets
              </button>
              <button 
                onClick={() => { setActiveTab("remove"); setTxSuccess(false); setTxError(null); }}
                className={`flex-1 pb-3 text-sm font-display font-700 border-b-2 transition-all ${
                  activeTab === "remove" 
                    ? "border-gold text-gold" 
                    : "border-transparent text-sub hover:text-text"
                }`}
              >
                Withdraw Liquidity
              </button>
            </div>

            {/* Add Liquidity Panel */}
            {activeTab === "add" && (
              <div className="space-y-4">
                
                {/* Single sided toggle */}
                <label className="flex items-center justify-between rounded-xl border border-border bg-surface px-4 py-2.5 cursor-pointer text-xs select-none">
                  <span className="text-text font-body font-medium">Single-Sided Deposit (USDC only)</span>
                  <input 
                    type="checkbox" 
                    className="rounded bg-black border-border text-cyan focus:ring-0 w-3.5 h-3.5 cursor-pointer"
                    checked={isDepositSingle} 
                    onChange={e => {
                      setIsDepositSingle(e.target.checked);
                      if (e.target.checked) setAmountEurc("0.00");
                      else setAmountEurc((Number(amountUsdc) * 0.925).toFixed(4));
                    }} 
                  />
                </label>

                {/* Input 1: USDC */}
                <div>
                  <div className="flex items-center justify-between text-xs text-sub/70 mb-2">
                    <label>Amount USDC</label>
                    {connected && address && (
                      <button 
                        onClick={() => handleUsdcChange(usdcBalance)} 
                        className="hover:text-gold transition-colors font-mono"
                      >
                        Balance: {usdcBalance}
                      </button>
                    )}
                  </div>
                  <div className="relative">
                    <input 
                      className="input font-mono pr-16" 
                      type="number" 
                      min="0" 
                      value={amountUsdc} 
                      onChange={e => handleUsdcChange(e.target.value)} 
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 font-display font-bold text-xs text-gold">USDC</span>
                  </div>
                </div>

                {/* Input 2: EURC */}
                {!isDepositSingle && (
                  <div>
                    <div className="flex items-center justify-between text-xs text-sub/70 mb-2">
                      <label>Amount EURC</label>
                      {connected && address && (
                        <button 
                          onClick={() => handleEurcChange(eurcBalance)} 
                          className="hover:text-gold transition-colors font-mono"
                        >
                          Balance: {eurcBalance}
                        </button>
                      )}
                    </div>
                    <div className="relative">
                      <input 
                        className="input font-mono pr-16" 
                        type="number" 
                        min="0" 
                        value={amountEurc} 
                        onChange={e => handleEurcChange(e.target.value)} 
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 font-display font-bold text-xs text-gold">EURC</span>
                    </div>
                  </div>
                )}

                {/* Info summary */}
                <div className="p-3.5 rounded-xl border border-border bg-surface/50 text-xs space-y-1.5 font-body">
                  <div className="flex justify-between text-sub">
                    <span>Pool Ratio Reference</span>
                    <span className="text-text font-mono">1 USDC = 0.925 EURC</span>
                  </div>
                  <div className="flex justify-between text-sub">
                    <span>Simulated Slippage</span>
                    <span className="text-text font-mono">0.05%</span>
                  </div>
                </div>

                {/* Connected / Correct Network validations */}
                {!connected ? (
                  <button onClick={connect} className="btn-gold w-full py-4 text-sm font-semibold">
                    Connect Wallet to Deposit
                  </button>
                ) : !correctNetwork ? (
                  <button onClick={switchNetwork} className="btn-gold w-full py-4 text-sm font-semibold">
                    Switch to Arc Testnet
                  </button>
                ) : (
                  <button 
                    onClick={executeAddLiquidity}
                    disabled={!!stepLoading || !amountUsdc || (!isDepositSingle && !amountEurc)}
                    className="btn-gold w-full py-4 text-sm font-semibold flex items-center justify-center gap-2"
                  >
                    {stepLoading ? (
                      <>
                        <span className="w-4 h-4 border-2 border-black border-t-transparent rounded-full spin" />
                        <span>Simulating Deposit...</span>
                      </>
                    ) : (
                      "Add Liquidity (Simulated)"
                    )}
                  </button>
                )}

              </div>
            )}

            {/* Withdraw Liquidity Panel */}
            {activeTab === "remove" && (
              <div className="space-y-5">
                
                {lpBalance <= 0 ? (
                  <div className="text-center py-8 px-4 border border-dashed border-border rounded-xl space-y-2">
                    <span className="text-xl block">⚠️</span>
                    <p className="text-xs text-sub/70">No LP balance available to withdraw. Deposit assets first!</p>
                  </div>
                ) : (
                  <>
                    {/* Percent selector */}
                    <div className="space-y-3">
                      <div className="flex justify-between text-xs text-sub/70">
                        <span>Withdraw Percentage</span>
                        <span className="text-gold font-mono font-bold">{withdrawPercent}%</span>
                      </div>
                      
                      <input 
                        type="range" 
                        min="1" 
                        max="100" 
                        value={withdrawPercent} 
                        onChange={e => setWithdrawPercent(Number(e.target.value))}
                        className="w-full h-1 bg-border rounded-lg appearance-none cursor-pointer accent-gold focus:outline-none"
                      />
                      
                      <div className="grid grid-cols-4 gap-2">
                        {[25, 50, 75, 100].map(pct => (
                          <button 
                            key={pct}
                            onClick={() => setWithdrawPercent(pct)}
                            className={`py-1.5 text-xs font-mono rounded-lg border transition-all ${
                              withdrawPercent === pct 
                                ? "bg-gold/15 border-gold text-gold" 
                                : "bg-surface border-border text-sub hover:text-text"
                            }`}
                          >
                            {pct === 100 ? "MAX" : `${pct}%`}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Return estimate details */}
                    <div className="p-4 rounded-xl border border-border bg-surface/50 space-y-2.5 text-xs">
                      <span className="text-[10px] font-mono text-sub block uppercase font-bold tracking-wider">Estimated Returns</span>
                      <div className="flex justify-between text-sub">
                        <span>Pooled USDC Dispensed</span>
                        <span className="text-text font-mono font-semibold">
                          {(Number(simulatedPooledUsdc) * withdrawPercent / 100).toFixed(2)} USDC
                        </span>
                      </div>
                      <div className="flex justify-between text-sub">
                        <span>Pooled EURC Dispensed</span>
                        <span className="text-text font-mono font-semibold">
                          {(Number(simulatedPooledEurc) * withdrawPercent / 100).toFixed(2)} EURC
                        </span>
                      </div>
                      <div className="flex justify-between text-sub">
                        <span>Simulated Yield Claimed</span>
                        <span className="text-gold font-mono font-semibold">
                          ${(accruedFees * withdrawPercent / 100).toFixed(6)}
                        </span>
                      </div>
                    </div>

                    {/* Connected validations */}
                    {!connected ? (
                      <button onClick={connect} className="btn-gold w-full py-4 text-sm font-semibold">
                        Connect Wallet to Withdraw
                      </button>
                    ) : (
                      <button 
                        onClick={executeRemoveLiquidity}
                        disabled={!!stepLoading}
                        className="btn-gold w-full py-4 text-sm font-semibold flex items-center justify-center gap-2"
                      >
                        {stepLoading ? (
                          <>
                            <span className="w-4 h-4 border-2 border-black border-t-transparent rounded-full spin" />
                            <span>Simulating Withdrawal...</span>
                          </>
                        ) : (
                          "Remove Liquidity (Simulated)"
                        )}
                      </button>
                    )}
                  </>
                )}

              </div>
            )}

            {/* Animation Step Log */}
            {stepLoading && (
              <div className="p-4 rounded-2xl border border-cyan/15 bg-cyan/5 text-center animate-fade-in space-y-2">
                <span className="block w-5 h-5 mx-auto border-2 border-cyan border-t-transparent rounded-full spin" />
                <p className="text-cyan text-xs font-mono leading-relaxed">{stepMessage}</p>
              </div>
            )}

            {/* Failure state */}
            {txError && (
              <div className="rounded-2xl border border-red/30 bg-red/5 p-4 text-red text-xs font-mono text-center">
                ❌ {txError}
              </div>
            )}

            {/* Success state */}
            {txSuccess && (
              <div className="rounded-2xl border border-green/30 bg-green/5 p-5 text-center space-y-2 animate-fade-up">
                <div className="w-10 h-10 mx-auto rounded-full bg-green/20 flex items-center justify-center text-green text-lg font-bold">✓</div>
                <p className="text-green font-display font-700 text-md">Simulation Completed!</p>
                <p className="text-sub text-[11px] leading-relaxed max-w-xs mx-auto">
                  The local simulated LP position has been successfully updated. Verify your new parameters in the left panel.
                </p>
                <button 
                  onClick={() => setTxSuccess(false)}
                  className="px-4 py-1.5 rounded-lg border border-border bg-surface text-sub hover:text-text transition-colors text-xs"
                >
                  Dismiss
                </button>
              </div>
            )}

          </div>

        </div>

      </div>
    </div>
  );
}
