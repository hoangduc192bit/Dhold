"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { getAllBounties, Bounty, BountyStatus, CONTRACT_ADDRESS } from "../../lib/contract";
import BountyCard from "../../components/BountyCard";

const FILTERS = [
  { label: "All", value: -1 },
  { label: "Open", value: BountyStatus.Open },
  { label: "Closed", value: BountyStatus.Closed },
  { label: "Cancelled", value: BountyStatus.Cancelled },
  { label: "Disputed", value: BountyStatus.Disputed },
];

export default function BountiesPage() {
  const [bounties, setBounties] = useState<Bounty[]>([]);
  const [filter, setFilter] = useState(-1);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const noContract = !CONTRACT_ADDRESS || CONTRACT_ADDRESS === "0x0";

  useEffect(() => {
    if (noContract) { setLoading(false); return; }
    getAllBounties().then(d => setBounties([...d].reverse())).catch(() => setError(true)).finally(() => setLoading(false));
  }, [noContract]);

  const filtered = bounties
    .filter(b => filter === -1 || b.status === filter)
    .filter(b => !search || b.title.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-14 overflow-hidden">
      {/* Header */}
      <div className="flex items-start justify-between mb-8 gap-4">
        <div>
          <h1 className="font-display font-700 text-4xl text-text mb-1">Bounties</h1>
          <p className="text-sub font-body text-sm">{loading ? "Loading…" : `${bounties.length} available`}</p>
        </div>
        <Link href="/create" className="btn-gold px-5 py-2.5 text-sm flex items-center gap-2 shrink-0">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
          Post Bounty
        </Link>
      </div>

      {/* Search + filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-8">
        <div className="relative flex-1">
          <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-sub" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
          <input className="input pl-10" placeholder="Search bounties…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div className="flex gap-2 flex-wrap">
          {FILTERS.map(f => (
            <button key={f.value} onClick={() => setFilter(f.value)}
              className={`px-4 py-2 rounded-xl text-sm font-body font-500 border transition-all ${filter === f.value ? "bg-gold/10 text-gold border-gold/30" : "bg-surface border-border text-sub hover:text-text"}`}>
              {f.label}
              {f.value !== -1 && <span className="ml-1.5 text-xs opacity-50">{bounties.filter(b => b.status === f.value).length}</span>}
            </button>
          ))}
        </div>
      </div>

      {/* States */}
      {noContract && (
        <div className="rounded-2xl border border-yellow/30 bg-yellow/5 p-8 text-center">
          <p className="text-yellow font-body text-sm">⚠️ Contract not configured. Set <code className="font-mono text-xs bg-surface px-1.5 py-0.5 rounded">NEXT_PUBLIC_CONTRACT_ADDRESS</code> in .env.local</p>
        </div>
      )}
      {!noContract && loading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => <div key={i} className="h-64 rounded-2xl shimmer" />)}
        </div>
      )}
      {!noContract && error && (
        <div className="rounded-2xl border border-red/30 bg-red/5 p-8 text-center">
          <p className="text-red font-body text-sm">Failed to load bounties. Check RPC connection.</p>
        </div>
      )}
      {!noContract && !loading && !error && filtered.length === 0 && (
        <div className="rounded-2xl border border-border bg-card p-16 text-center">
          <div className="w-16 h-16 rounded-full bg-surface border border-border flex items-center justify-center mx-auto mb-4">
            <svg className="w-7 h-7 text-sub/30" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
          </div>
          <p className="font-display font-600 text-text text-sm mb-1">No bounties found</p>
          <p className="text-sub text-xs font-body mb-5">{search ? "Try a different search term." : "Be the first to post a bounty on Arc."}</p>
          {!search && <Link href="/create" className="btn-gold px-5 py-2.5 text-sm inline-flex">Post First Bounty</Link>}
        </div>
      )}
      {!noContract && !loading && !error && filtered.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(b => <BountyCard key={String(b.id)} bounty={b} />)}
        </div>
      )}
    </div>
  );
}
