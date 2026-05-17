"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { getAllBounties, Bounty, BountyStatus, fmtUSDC, CONTRACT_ADDRESS } from "../lib/contract";
import BountyCard from "../components/BountyCard";

function StatBox({ label, value, accent }: { label: string; value: string; accent?: string }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5 relative overflow-hidden">
      <div className={`absolute top-0 right-0 w-20 h-20 rounded-full blur-2xl opacity-10 -translate-y-6 translate-x-6 ${accent ?? "bg-gold"}`} />
      <p className={`font-display font-800 text-2xl mb-1 ${accent ? "" : "text-gold-gradient"}`}>{value}</p>
      <p className="text-xs text-sub font-body">{label}</p>
    </div>
  );
}

export default function HomePage() {
  const [bounties, setBounties] = useState<Bounty[]>([]);
  const [loading, setLoading] = useState(true);
  const noContract = !CONTRACT_ADDRESS || CONTRACT_ADDRESS === "0x0";

  useEffect(() => {
    if (noContract) { setLoading(false); return; }
    getAllBounties().then(data => setBounties([...data].reverse())).catch(() => {}).finally(() => setLoading(false));
  }, [noContract]);

  const open = bounties.filter(b => b.status === BountyStatus.Open);
  const closed = bounties.filter(b => b.status === BountyStatus.Closed);
  const volume = bounties.reduce((s, b) => s + b.amount, 0n);
  const featured = open.slice(0, 3);

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-grid bg-grid opacity-100" />
        <div className="absolute inset-0 bg-hero-glow" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-gold/5 rounded-full blur-3xl pointer-events-none" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 pt-24 pb-20 text-center">
          {/* Pill */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-gold/20 bg-gold/5 text-gold text-xs font-body font-500 mb-8">
            <span className="w-1.5 h-1.5 rounded-full bg-gold dot-pulse" />
            Live on Arc Testnet · Native USDC
          </div>

          {/* Heading */}
          <h1 className="font-display font-800 text-5xl sm:text-6xl lg:text-7xl leading-none tracking-tight mb-6">
            <span className="text-text">The Bounty Platform</span>
            <br />
            <span className="text-gold-gradient">Built for Arc Builders</span>
          </h1>

          <p className="text-sub font-body text-lg sm:text-xl max-w-lg mx-auto mb-10 leading-relaxed">
            Post work. Lock USDC. Get it done.
            <br />
            <span className="text-text/80">Trustless escrow on Arc Network.</span>
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link href="/create" className="btn-gold px-8 py-3.5 text-sm flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
              Post a Bounty
            </Link>
            <Link href="/bounties" className="btn-ghost px-8 py-3.5 text-sm flex items-center gap-2">
              Browse Bounties
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
            </Link>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 pb-16">
        {loading ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => <div key={i} className="h-24 rounded-2xl shimmer" />)}
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatBox label="Total Bounties" value={String(bounties.length)} />
            <StatBox label="USDC Escrowed" value={`${fmtUSDC(volume)}`} />
            <StatBox label="Open Now" value={String(open.length)} />
            <StatBox label="Completed" value={String(closed.length)} />
          </div>
        )}
      </section>

      {/* Featured bounties */}
      {featured.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 pb-16">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="font-display font-700 text-xl text-text">Featured Bounties</h2>
              <p className="text-sub text-sm font-body mt-0.5">Earn USDC right now</p>
            </div>
            <Link href="/bounties" className="text-sm text-gold hover:text-gold-dim font-body transition-colors flex items-center gap-1">
              View all <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {featured.map(b => <BountyCard key={String(b.id)} bounty={b} />)}
          </div>
        </section>
      )}

      {/* How it works */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 pb-24">
        <div className="rounded-3xl border border-border bg-card p-8 sm:p-12">
          <div className="text-center mb-10">
            <h2 className="font-display font-700 text-2xl text-text mb-2">How It Works</h2>
            <p className="text-sub font-body text-sm">Four steps, fully onchain</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { n: "01", t: "Post Bounty", d: "Describe the work, set your USDC reward. Funds lock in the smart contract instantly." },
              { n: "02", t: "Lock USDC", d: "Your USDC is secured onchain. Nobody can touch it until the work is approved." },
              { n: "03", t: "Submit Work", d: "Contributors submit a link to their work — PR, demo, doc, or any proof of work." },
              { n: "04", t: "Approve & Pay", d: "Review submissions. Approve the best one. USDC goes to the winner instantly." },
            ].map((s, i) => (
              <div key={i} className="relative">
                {i < 3 && <div className="hidden lg:block absolute top-6 left-full w-6 h-px bg-border z-10 -translate-x-3" />}
                <div className="flex items-center gap-3 mb-3">
                  <span className="font-mono text-xs text-gold font-600">{s.n}</span>
                  <div className="flex-1 h-px bg-border" />
                </div>
                <h3 className="font-display font-600 text-text text-sm mb-2">{s.t}</h3>
                <p className="text-sub text-xs font-body leading-relaxed">{s.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
