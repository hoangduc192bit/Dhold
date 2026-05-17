"use client";
import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { isAddress } from "viem";
import { useWallet } from "../../../hooks/useWallet";
import { arcscanTx, shortAddr } from "../../../lib/contract";
import { appKitSend, fallbackErc20Send, findTxHash, stringifyResult } from "../../../lib/circlekit";

function PayLinkContent() {
  const params = useSearchParams();
  const { address, connected, connect } = useWallet();

  const to = params.get("to") || "";
  const amount = params.get("amount") || "";
  const desc = params.get("desc") || "USDC Payment";
  const name = params.get("name") || "Someone";

  const [paying, setPaying] = useState(false);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [valid, setValid] = useState(false);

  useEffect(() => {
    setValid(isAddress(to) && !!amount && parseFloat(amount) > 0);
  }, [to, amount]);

  async function pay() {
    if (!address || !valid) return;
    setPaying(true); setError(null);
    try {
      let result: unknown;
      try {
        result = await appKitSend({ to, amount, token: "USDC" });
      } catch (kitError) {
        // Fallback: direct ERC-20 USDC transfer on Arc Testnet.
        result = await fallbackErc20Send({ account: address, to: to as `0x${string}`, amount, token: "USDC" });
        console.warn("App Kit Send fallback used", kitError);
      }
      const hash = typeof result === "string" ? result : findTxHash(result);
      setTxHash(hash || "success");
      console.log("Circle/AppKit send result", stringifyResult(result));
    } catch (err: unknown) {
      setError((err as { shortMessage?: string })?.shortMessage ?? (err as { message?: string })?.message ?? "Transaction failed");
    } finally { setPaying(false); }
  }

  if (!valid) return (
    <div className="max-w-lg mx-auto px-4 sm:px-6 py-16 text-center">
      <div className="card p-10 space-y-4">
        <span className="text-4xl">❌</span>
        <p className="font-display font-600 text-text">Invalid Payment Link</p>
        <p className="text-sub font-body text-sm">This link is missing required information.</p>
      </div>
    </div>
  );

  return (
    <div className="max-w-lg mx-auto px-4 sm:px-6 py-16">
      <div className="card p-8 space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="w-16 h-16 rounded-full bg-gold-gradient flex items-center justify-center mx-auto">
            <svg className="w-7 h-7 text-bg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 className="font-display font-700 text-2xl text-text">Payment Request</h1>
          <p className="text-sub font-body text-sm"><span className="text-text font-500">{name}</span> is requesting USDC</p>
        </div>

        {/* Amount */}
        <div className="rounded-2xl border border-gold/20 bg-gold/5 p-6 text-center">
          <p className="text-sub font-body text-xs mb-2">Amount to pay</p>
          <div className="flex items-baseline justify-center gap-2">
            <span className="font-display font-800 text-5xl text-gold-gradient tabular">{parseFloat(amount).toLocaleString("en-US", { minimumFractionDigits: 2 })}</span>
            <span className="text-sub text-lg font-body">USDC</span>
          </div>
        </div>

        {/* Details */}
        <div className="space-y-2">
          <div className="rounded-xl bg-surface border border-border px-4 py-3 flex justify-between items-center">
            <p className="text-xs text-sub/60 font-body">To</p>
            <p className="font-mono text-sm text-gold">{shortAddr(to)}</p>
          </div>
          <div className="rounded-xl bg-surface border border-border px-4 py-3 flex justify-between items-center">
            <p className="text-xs text-sub/60 font-body">For</p>
            <p className="text-sm text-text font-body">{desc}</p>
          </div>
          <div className="rounded-xl bg-surface border border-border px-4 py-3 flex justify-between items-center">
            <p className="text-xs text-sub/60 font-body">Network</p>
            <p className="text-sm text-text font-body">Arc Testnet</p>
          </div>
        </div>

        {/* Action */}
        {txHash ? (
          <div className="space-y-3 animate-fade-up">
            <div className="flex items-center gap-3 p-4 rounded-xl border border-green/30 bg-green/5">
              <div className="w-8 h-8 rounded-full bg-green/20 flex items-center justify-center shrink-0">
                <svg className="w-4 h-4 text-green" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
              </div>
              <div>
                <p className="text-green font-display font-600 text-sm">Payment sent! 🎉</p>
                <p className="text-sub text-xs font-body mt-0.5">USDC is on its way</p>
              </div>
            </div>
            <a href={txHash === "success" ? "https://testnet.arcscan.app" : arcscanTx(txHash)} target="_blank" rel="noopener noreferrer"
              className="flex items-center justify-center gap-1.5 text-xs text-gold hover:text-gold-dim font-body transition-colors">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
              View on Arcscan
            </a>
          </div>
        ) : !connected ? (
          <button onClick={connect} className="btn-gold w-full py-4 rounded-2xl text-sm">
            Connect Wallet to Pay
          </button>
        ) : (
          <>
            {error && <div className="rounded-xl border border-red/30 bg-red/5 px-4 py-3 text-sm text-red font-body">{error}</div>}
            <button onClick={pay} disabled={paying}
              className="btn-gold w-full py-4 rounded-2xl text-sm flex items-center justify-center gap-2 disabled:opacity-50">
              {paying
                ? <><div className="w-4 h-4 border-2 border-bg/40 border-t-bg rounded-full spin" />Processing…</>
                : `Pay ${amount} USDC`}
            </button>
            <p className="text-xs text-sub/50 font-body text-center">
              Make sure you're on Arc Testnet before paying.
            </p>
          </>
        )}
      </div>
    </div>
  );
}

export default function PayLinkPage() {
  return (
    <Suspense fallback={<div className="max-w-lg mx-auto px-4 sm:px-6 py-16 text-center"><div className="card p-10 space-y-4"><p className="text-sub font-body">Loading...</p></div></div>}>
      <PayLinkContent />
    </Suspense>
  );
}
