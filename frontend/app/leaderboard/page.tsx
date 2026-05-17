"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { getAllBounties, getWinner, shortAddr, fmtUSDC, CONTRACT_ADDRESS } from "../../lib/contract";
import TiltCard from "../../components/TiltCard";

type UserStats = {
  jobsCompleted: bigint;
  jobsPosted: bigint;
  totalEarned: bigint;
  totalPaid: bigint;
};

type Row = {
  address: `0x${string}`;
  stats: UserStats;
  score: number;
};

function scoreOf(stats: UserStats) {
  return Number(stats.jobsCompleted) * 20 + Number(stats.jobsPosted) * 6 + Number(stats.totalEarned) / 1e18;
}

export default function LeaderboardPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [tab, setTab] = useState<"all" | "freelancers" | "clients">("all");

  useEffect(() => {
    async function load() {
      setLoading(true); setErr(null);
      try {
        if (!CONTRACT_ADDRESS || CONTRACT_ADDRESS === "0x0") throw new Error("Missing contract address");
        const bounties = await getAllBounties();
        
        const statsMap = new Map<string, UserStats>();
        const getStats = (addr: string) => {
          const laddr = addr.toLowerCase();
          if (!statsMap.has(laddr)) {
            statsMap.set(laddr, { jobsCompleted: 0n, jobsPosted: 0n, totalEarned: 0n, totalPaid: 0n });
          }
          return statsMap.get(laddr)!;
        };

        const promises = bounties.map(async (b) => {
          const cStats = getStats(b.client);
          cStats.jobsPosted += 1n;
          if (b.status === 1) { // Closed
            cStats.totalPaid += b.amount;
            try {
              const winner = await getWinner(b.id);
              if (winner && winner !== "0x0000000000000000000000000000000000000000") {
                const wStats = getStats(winner);
                wStats.jobsCompleted += 1n;
                wStats.totalEarned += b.amount;
              }
            } catch (e) {
              // Ignore if getWinner fails
            }
          }
        });

        await Promise.all(promises);

        const data: Row[] = Array.from(statsMap.entries()).map(([addr, stats]) => ({
          address: addr as `0x${string}`,
          stats,
          score: scoreOf(stats),
        }));

        data.sort((a, b) => b.score - a.score);
        setRows(data);
      } catch (e: unknown) {
        setErr((e as { message?: string })?.message ?? "Leaderboard unavailable.");
      } finally { setLoading(false); }
    }
    load();
  }, []);

  const filtered = useMemo(() => rows.filter(r => {
    if (tab === "freelancers") return r.stats.jobsCompleted > 0n;
    if (tab === "clients") return r.stats.jobsPosted > 0n;
    return true;
  }), [rows, tab]);

  return (
    <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-14 overflow-hidden">
      <div className="animated-blob left-1/3 top-10" />
      <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-5 mb-8">
        <div>
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-gold/20 bg-gold/5 text-gold text-xs font-mono font-600 mb-4">REPUTATION</div>
          <h1 className="font-display font-700 text-5xl text-text leading-tight">Leaderboard</h1>
        </div>
        <div className="flex gap-2 rounded-2xl border border-border bg-surface p-1">
          {(["all", "freelancers", "clients"] as const).map(x => <button key={x} onClick={() => setTab(x)} className={`px-4 py-2 rounded-xl text-sm capitalize ${tab === x ? "bg-gold/10 text-gold" : "text-sub hover:text-text"}`}>{x}</button>)}
        </div>
      </div>

      {loading ? <div className="grid gap-3">{[1,2,3,4].map(i => <div key={i} className="h-24 rounded-2xl shimmer" />)}</div> : err ? (
        <TiltCard className="p-8 text-center space-y-4">
          <p className="text-red font-body">{err}</p>
          <Link href="/bounties" className="btn-gold inline-block px-6 py-3 text-sm">Back to Jobs</Link>
        </TiltCard>
      ) : filtered.length === 0 ? (
        <TiltCard className="p-10 text-center"><p className="text-sub">No activity yet. Complete a job to get on the leaderboard.</p></TiltCard>
      ) : (
        <div className="space-y-4">
          {filtered.map((r, i) => <LeaderRow key={r.address} row={r} rank={i + 1} />)}
        </div>
      )}
    </div>
  );
}

function LeaderRow({ row, rank }: { row: Row; rank: number }) {
  return (
    <TiltCard className="p-5 sm:p-6 grid lg:grid-cols-[70px_1fr_1.2fr] gap-5 items-center">
      <div className="w-14 h-14 rounded-2xl bg-gold-gradient text-bg font-display font-800 text-xl flex items-center justify-center">#{rank}</div>
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2 mb-2">
          <p className="font-mono text-gold text-sm">{shortAddr(row.address)}</p>
          {row.stats.jobsCompleted > 0n && <span className="badge bg-green/10 border border-green/20 text-green">Freelancer</span>}
          {row.stats.jobsPosted > 0n && <span className="badge bg-blue/10 border border-blue/20 text-blue">Client</span>}
        </div>
      </div>
      <div className="grid sm:grid-cols-4 gap-3">
        <Metric label="Completed" value={String(row.stats.jobsCompleted)} />
        <Metric label="Posted" value={String(row.stats.jobsPosted)} />
        <Metric label="Earned" value={`${fmtUSDC(row.stats.totalEarned)} USDC`} />
        <Metric label="Paid" value={`${fmtUSDC(row.stats.totalPaid)} USDC`} />
      </div>
    </TiltCard>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return <div className="rounded-2xl border border-border bg-surface p-3"><p className="text-[10px] text-sub/60 mb-1">{label}</p><p className="font-display font-700 text-text text-sm tabular">{value}</p></div>;
}
