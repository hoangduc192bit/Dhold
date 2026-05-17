"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { getBountiesByClient, getAllBounties, Bounty, BountyStatus, fmtUSDC, shortAddr, CONTRACT_ADDRESS } from "../../lib/contract";
import { arcscanAddr } from "../../lib/contract";
import { useWallet } from "../../hooks/useWallet";
import BountyCard from "../../components/BountyCard";

export default function Dashboard() {
  const { address, connected, balance, connect } = useWallet();
  const [created, setCreated] = useState<Bounty[]>([]);
  const [participated, setParticipated] = useState<Bounty[]>([]);
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState<"created" | "participated">("created");
  const noContract = !CONTRACT_ADDRESS || CONTRACT_ADDRESS === "0x0";

  useEffect(() => {
    if (!address || noContract) return;
    setLoading(true);
    Promise.all([getBountiesByClient(address), getAllBounties()]).then(([mine, all]) => {
      setCreated([...mine].reverse());
      // bounties where user submitted (client != user but user is in submissions - approximated by all open/closed)
      setParticipated([...all].filter(b => b.client.toLowerCase() !== address.toLowerCase()).reverse());
    }).catch(() => {}).finally(() => setLoading(false));
  }, [address, noContract]);

  const earned = created.filter(b => b.status === BountyStatus.Closed).reduce((s, b) => s + b.amount, BigInt(0));
  const locked = created.filter(b => b.status === BountyStatus.Open).reduce((s, b) => s + b.amount, BigInt(0));

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 space-y-8">
      <h1 className="font-display font-800 text-4xl text-text">Dashboard</h1>

      {!connected ? (
        <div className="card p-16 text-center">
          <div className="w-16 h-16 rounded-full bg-gold/5 border border-gold/20 flex items-center justify-center mx-auto mb-5">
            <svg className="w-7 h-7 text-gold/40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
          </div>
          <p className="font-display font-600 text-text mb-1">Connect Your Wallet</p>
          <p className="text-sub text-sm font-body mb-6">View your bounties and track your activity.</p>
          <button onClick={connect} className="btn-gold px-6 py-3 text-sm">Connect Wallet</button>
        </div>
      ) : (
        <>
          {/* Wallet card */}
          <div className="card p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-gold-gradient flex items-center justify-center shrink-0">
                <span className="font-mono text-sm text-bg font-800">{address!.slice(2, 4).toUpperCase()}</span>
              </div>
              <div>
                <a href={arcscanAddr(address!)} target="_blank" rel="noopener noreferrer" className="font-mono text-sm text-gold hover:text-gold-dim transition-colors">{shortAddr(address!)}</a>
                <p className="text-xs text-sub font-body">Arc Testnet</p>
              </div>
            </div>
            <div className="flex items-baseline gap-1.5 bg-gold/5 border border-gold/20 rounded-xl px-4 py-2.5">
              <span className="font-display font-700 text-2xl text-gold-gradient">{balance}</span>
              <span className="text-sub font-body text-sm">USDC</span>
            </div>
          </div>

          {/* Stats */}
          {!noContract && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { label: "Bounties Posted", value: String(created.length) },
                { label: "Open Bounties", value: String(created.filter(b => b.status === BountyStatus.Open).length) },
                { label: "USDC Locked", value: `${fmtUSDC(locked)}` },
                { label: "Completed", value: String(created.filter(b => b.status === BountyStatus.Closed).length) },
              ].map((s, i) => (
                <div key={i} className="card p-4">
                  <p className="font-display font-700 text-xl text-gold-gradient mb-0.5">{s.value}</p>
                  <p className="text-xs text-sub font-body">{s.label}</p>
                </div>
              ))}
            </div>
          )}

          {/* Tabs */}
          {!noContract && (
            <div>
              <div className="flex gap-1 border-b border-border mb-6">
                {([["created", "My Bounties"], ["participated", "All Bounties"]] as const).map(([t, l]) => (
                  <button key={t} onClick={() => setTab(t)}
                    className={`pb-3 px-1 mr-4 text-sm font-body font-500 border-b-2 transition-all ${tab === t ? "border-gold text-gold" : "border-transparent text-sub hover:text-text"}`}>
                    {l}
                    <span className="ml-2 text-xs opacity-50">{t === "created" ? created.length : participated.length}</span>
                  </button>
                ))}
              </div>

              {loading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[...Array(3)].map((_, i) => <div key={i} className="h-52 rounded-2xl shimmer" />)}
                </div>
              ) : (
                <>
                  {tab === "created" && (created.length === 0 ? (
                    <div className="card p-12 text-center">
                      <p className="text-sub font-body text-sm mb-4">You haven't posted any bounties yet.</p>
                      <Link href="/create" className="btn-gold px-5 py-2.5 text-sm inline-flex">Post Your First Bounty</Link>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {created.map(b => <BountyCard key={String(b.id)} bounty={b} />)}
                    </div>
                  ))}
                  {tab === "participated" && (participated.length === 0 ? (
                    <div className="card p-12 text-center">
                      <p className="text-sub font-body text-sm mb-4">No bounties available.</p>
                      <Link href="/bounties" className="btn-gold px-5 py-2.5 text-sm inline-flex">Browse Bounties</Link>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {participated.map(b => <BountyCard key={String(b.id)} bounty={b} />)}
                    </div>
                  ))}
                </>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
