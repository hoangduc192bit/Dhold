"use client";
import { useEffect, useState, useCallback } from "react";
import { formatEther, parseEther, isAddress } from "viem";
import { useWallet } from "../../hooks/useWallet";
import { pub, wal, shortAddr, arcscanAddr, arcscanTx } from "../../lib/contract";
import Link from "next/link";

interface TxItem {
  hash: string;
  type: "sent" | "received";
  amount: string;
  to: string;
  from: string;
  timestamp: number;
}

export default function WalletPage() {
  const { address, connected, balance, connect, correctNetwork, switchNetwork } = useWallet();
  const [tab, setTab] = useState<"overview" | "send" | "receive">("overview");
  const [sendTo, setSendTo] = useState("");
  const [sendAmt, setSendAmt] = useState("");
  const [sendNote, setSendNote] = useState("");
  const [sending, setSending] = useState(false);
  const [sendHash, setSendHash] = useState<string | null>(null);
  const [sendErr, setSendErr] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [fullBalance, setFullBalance] = useState("0.0000");

  const loadBalance = useCallback(async () => {
    if (!address) return;
    try {
      const bal = await pub().getBalance({ address });
      setFullBalance(parseFloat(formatEther(bal)).toFixed(6));
    } catch {}
  }, [address]);

  useEffect(() => { loadBalance(); }, [loadBalance]);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!address || !isAddress(sendTo) || !sendAmt) return;
    setSending(true); setSendErr(null); setSendHash(null);
    try {
      const w = wal();
      if (!w) throw new Error("No wallet");
      const hash = await w.sendTransaction({
        account: address,
        to: sendTo as `0x${string}`,
        value: parseEther(sendAmt),
      });
      setSendHash(hash);
      setSendTo(""); setSendAmt(""); setSendNote("");
      setTimeout(loadBalance, 3000);
    } catch (err: unknown) {
      setSendErr((err as { shortMessage?: string })?.shortMessage ?? (err as { message?: string })?.message ?? "Transaction failed");
    } finally { setSending(false); }
  }

  function copyAddress() {
    if (!address) return;
    navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const qrUrl = address
    ? `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${address}&bgcolor=13151E&color=F5C542&margin=16`
    : "";

  const TABS = [
    { key: "overview", label: "Overview", icon: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" },
    { key: "send", label: "Send", icon: "M12 19l9 2-9-18-9 18 9-2zm0 0v-8" },
    { key: "receive", label: "Receive", icon: "M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" },
  ] as const;

  if (!connected) return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-16 text-center">
      <div className="card p-12 space-y-5">
        <div className="w-20 h-20 rounded-full bg-gold/5 border border-gold/20 flex items-center justify-center mx-auto">
          <svg className="w-9 h-9 text-gold/50" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
        </div>
        <div>
          <h2 className="font-display font-700 text-xl text-text mb-1">Connect Your Wallet</h2>
          <p className="text-sub font-body text-sm">Connect to view your balance, send and receive USDC.</p>
        </div>
        <button onClick={connect} className="btn-gold px-8 py-3 text-sm">Connect Wallet</button>
      </div>
    </div>
  );

  if (!correctNetwork) return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-16 text-center">
      <div className="card p-12 space-y-5">
        <p className="text-red font-display font-600">Wrong Network</p>
        <p className="text-sub font-body text-sm">Switch to Arc Testnet to use Wallet Hub.</p>
        <button onClick={switchNetwork} className="btn-gold px-8 py-3 text-sm">Switch to Arc Testnet</button>
      </div>
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-12 space-y-6">
      <div>
        <h1 className="font-display font-800 text-4xl text-text mb-1">Wallet Hub</h1>
        <p className="text-sub font-body text-sm">Send, receive, and manage your USDC on Arc.</p>
      </div>

      {/* Balance card */}
      <div className="relative rounded-3xl overflow-hidden border border-gold/20 bg-card p-8">
        <div className="absolute inset-0 bg-gradient-to-br from-gold/5 via-transparent to-transparent" />
        <div className="absolute top-0 right-0 w-64 h-64 rounded-full bg-gold/4 blur-3xl -translate-y-20 translate-x-20" />
        <div className="relative">
          <p className="text-sub font-body text-sm mb-3">Total Balance</p>
          <div className="flex items-baseline gap-2 mb-1">
            <span className="font-display font-800 text-5xl text-gold-gradient tabular">{fullBalance}</span>
            <span className="text-sub text-lg font-body">USDC</span>
          </div>
          <p className="text-sub/60 text-xs font-body mb-6">Arc Testnet</p>
          <div className="flex items-center gap-2">
            <a href={arcscanAddr(address!)} target="_blank" rel="noopener noreferrer"
              className="font-mono text-sm text-gold/80 hover:text-gold transition-colors">{shortAddr(address!)}</a>
            <button onClick={copyAddress} className="p-1.5 rounded-lg bg-gold/10 hover:bg-gold/20 transition-all">
              {copied
                ? <svg className="w-3.5 h-3.5 text-green" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                : <svg className="w-3.5 h-3.5 text-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
              }
            </button>
          </div>
        </div>
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-3 gap-3">
        {TABS.map(t => (
          <button key={t.key} onClick={() => setTab(t.key as typeof tab)}
            className={`flex flex-col items-center gap-2 p-4 rounded-2xl border transition-all ${tab === t.key ? "bg-gold/10 border-gold/30 text-gold" : "bg-surface border-border text-sub hover:text-text hover:border-gold/20"}`}>
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d={t.icon} />
            </svg>
            <span className="text-xs font-body font-500">{t.label}</span>
          </button>
        ))}
      </div>

      {/* Tab content */}
      {tab === "overview" && (
        <div className="card p-6 space-y-4">
          <h3 className="font-display font-600 text-text">Quick Stats</h3>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: "Network", value: "Arc Testnet" },
              { label: "Chain ID", value: "5042002" },
              { label: "Currency", value: "USDC (native)" },
              { label: "Explorer", value: "Arcscan" },
            ].map((s, i) => (
              <div key={i} className="rounded-xl bg-surface border border-border px-4 py-3">
                <p className="text-[10px] text-sub/60 font-body mb-1">{s.label}</p>
                <p className="text-sm text-text font-body font-500">{s.value}</p>
              </div>
            ))}
          </div>
          <div className="divider" />
          <div className="flex gap-3">
            <Link href="/faucet" className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-surface border border-border text-sub text-sm font-body hover:border-gold/30 hover:text-text transition-all">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              Get Test USDC
            </Link>
            <Link href="/pay" className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-surface border border-border text-sub text-sm font-body hover:border-gold/30 hover:text-text transition-all">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>
              Payment Link
            </Link>
          </div>
        </div>
      )}

      {tab === "send" && (
        <div className="card p-6">
          <h3 className="font-display font-600 text-text mb-5">Send USDC</h3>
          {sendHash ? (
            <div className="space-y-4 animate-fade-up">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-green/15 flex items-center justify-center shrink-0">
                  <svg className="w-5 h-5 text-green" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                </div>
                <div>
                  <p className="text-green font-display font-600 text-sm">Sent successfully!</p>
                  <p className="text-sub text-xs font-body">USDC is on its way</p>
                </div>
              </div>
              <div className="rounded-xl bg-surface border border-border px-4 py-3">
                <p className="text-[10px] text-sub/60 font-body mb-1">Tx Hash</p>
                <p className="font-mono text-xs text-text break-all">{sendHash}</p>
              </div>
              <a href={arcscanTx(sendHash)} target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs text-gold hover:text-gold-dim font-body transition-colors">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                View on Arcscan
              </a>
              <button onClick={() => setSendHash(null)} className="w-full py-2.5 rounded-xl bg-surface border border-border text-sub text-sm font-body hover:text-text transition-all">
                Send Again
              </button>
            </div>
          ) : (
            <form onSubmit={handleSend} className="space-y-4">
              <div>
                <label className="block text-xs text-sub/70 font-body mb-2">Recipient Address</label>
                <input className="input font-mono text-sm" value={sendTo} onChange={e => setSendTo(e.target.value)}
                  placeholder="0x..." required />
                {sendTo && !isAddress(sendTo) && <p className="text-xs text-red font-body mt-1">Invalid address</p>}
              </div>
              <div>
                <label className="block text-xs text-sub/70 font-body mb-2">Amount (USDC)</label>
                <div className="relative">
                  <input className="input font-mono pr-20" type="number" value={sendAmt} onChange={e => setSendAmt(e.target.value)}
                    placeholder="0.00" min="0.001" step="any" required />
                  <button type="button" onClick={() => setSendAmt(fullBalance)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gold font-body font-500 hover:text-gold-dim transition-colors">MAX</button>
                </div>
                <p className="text-xs text-sub/50 font-body mt-1">Balance: {fullBalance} USDC</p>
              </div>
              <div>
                <label className="block text-xs text-sub/70 font-body mb-2">Note <span className="text-sub/40">(optional)</span></label>
                <input className="input" value={sendNote} onChange={e => setSendNote(e.target.value)} placeholder="What's this for?" />
              </div>
              {sendErr && <div className="rounded-xl border border-red/30 bg-red/5 px-4 py-3 text-sm text-red font-body">{sendErr}</div>}
              <button type="submit" disabled={sending || !sendTo || !sendAmt || !isAddress(sendTo)}
                className="btn-gold w-full py-3.5 rounded-2xl text-sm flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed">
                {sending
                  ? <><div className="w-4 h-4 border-2 border-bg/40 border-t-bg rounded-full spin" />Sending…</>
                  : <>Send {sendAmt || "0"} USDC</>}
              </button>
            </form>
          )}
        </div>
      )}

      {tab === "receive" && (
        <div className="card p-6 text-center space-y-5">
          <h3 className="font-display font-600 text-text">Receive USDC</h3>
          <p className="text-sub text-sm font-body">Share your address or QR code to receive USDC on Arc Testnet.</p>
          {/* QR Code */}
          <div className="flex justify-center">
            <div className="p-3 rounded-2xl border border-gold/20 bg-surface inline-block">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={qrUrl} alt="Wallet QR" width={180} height={180} className="rounded-xl" />
            </div>
          </div>
          {/* Address */}
          <div className="rounded-xl bg-surface border border-border px-4 py-3 text-left">
            <p className="text-[10px] text-sub/60 font-body mb-1">Your Arc Address</p>
            <p className="font-mono text-sm text-text break-all">{address}</p>
          </div>
          <button onClick={copyAddress}
            className={`w-full py-3 rounded-2xl text-sm font-body font-500 border transition-all flex items-center justify-center gap-2 ${copied ? "bg-green/10 border-green/30 text-green" : "bg-surface border-border text-sub hover:border-gold/30 hover:text-text"}`}>
            {copied
              ? <><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>Copied!</>
              : <><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>Copy Address</>}
          </button>
        </div>
      )}
    </div>
  );
}
