"use client";
import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { getBounty, getSubmissions, checkHasSubmitted, Bounty, Submission, BountyStatus, fmtUSDC, fmtDate, fmtDeadline, shortAddr, CONTRACT_ADDRESS, txSubmitWork, txApproveWork, txCancelBounty, txMarkDisputed, getWinner } from "../../../lib/contract";
import { arcscanAddr } from "../../../lib/contract";
import { useWallet } from "../../../hooks/useWallet";
import StatusBadge from "../../../components/StatusBadge";
import TxToast from "../../../components/TxToast";

const ZERO = "0x0000000000000000000000000000000000000000";

export default function BountyDetail() {
  const { id } = useParams<{ id: string }>();
  const { address } = useWallet();
  const [bounty, setBounty] = useState<Bounty | null>(null);
  const [subs, setSubs] = useState<Submission[]>([]);
  const [alreadySubmitted, setAlreadySubmitted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [winner, setWinner] = useState<`0x${string}` | null>(null);

  const load = useCallback(async () => {
    if (!id || !CONTRACT_ADDRESS || CONTRACT_ADDRESS === "0x0") { setLoading(false); return; }
    setLoading(true);
    try {
      const [b, s] = await Promise.all([getBounty(BigInt(id)), getSubmissions(BigInt(id))]);
      setBounty(b); setSubs(s);
      if (b.status === BountyStatus.Closed) {
        try { setWinner(await getWinner(BigInt(id))); } catch { setWinner(null); }
      } else { setWinner(null); }
      if (address) {
        setAlreadySubmitted(await checkHasSubmitted(BigInt(id), address));
      }
    } catch { setError(true); }
    finally { setLoading(false); }
  }, [id, address]);

  useEffect(() => { load(); }, [load]);

  const isClient = address && bounty && address.toLowerCase() === bounty.client.toLowerCase();
  const nowTs = BigInt(Math.floor(Date.now() / 1000));
  const isExpired = bounty && bounty.deadline > 0n && nowTs > bounty.deadline;
  const isFull = bounty && bounty.maxSubmissions > 0n && BigInt(subs.length) >= bounty.maxSubmissions;

  if (loading) return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12 space-y-4">
      {[...Array(3)].map((_, i) => <div key={i} className={`rounded-2xl shimmer ${i === 0 ? "h-64" : "h-40"}`} />)}
    </div>
  );

  if (error || !bounty) return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12">
      <div className="rounded-2xl border border-red/30 bg-red/5 p-10 text-center">
        <p className="text-red font-body mb-4">Bounty not found or contract unreachable.</p>
        <Link href="/bounties" className="text-sm text-gold hover:text-gold-dim font-body">← Back to Bounties</Link>
      </div>
    </div>
  );

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12 space-y-6">
      <Link href="/bounties" className="inline-flex items-center gap-1.5 text-sm text-sub hover:text-text font-body transition-colors">
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
        All Bounties
      </Link>

      {/* Main card */}
      <div className="card p-6 sm:p-8 space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[10px] font-mono text-sub/50">#{String(bounty.id).padStart(4, "0")}</span>
              {bounty.category && <span className="text-[10px] font-body font-600 uppercase tracking-widest text-sub bg-surface border border-border px-2 py-0.5 rounded-full">{bounty.category}</span>}
            </div>
            <h1 className="font-display font-800 text-2xl sm:text-3xl text-text leading-tight">{bounty.title}</h1>
          </div>
          <StatusBadge status={bounty.status} />
        </div>

        {/* Amount */}
        <div className="flex items-baseline gap-2">
          <span className="font-display font-800 text-5xl text-gold-gradient tabular">{fmtUSDC(bounty.amount)}</span>
          <span className="text-sub font-body text-lg">USDC</span>
        </div>

        {/* Info row */}
        <div className="flex flex-wrap gap-3">
          {bounty.deadline > 0n && (
            <div className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border ${isExpired ? "border-red/30 bg-red/5" : "border-gold/20 bg-gold/5"}`}>
              <svg className={`w-4 h-4 ${isExpired ? "text-red" : "text-gold"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              <div>
                <p className="text-[10px] text-sub/60 font-body">Deadline</p>
                <p className={`text-sm font-body font-600 ${isExpired ? "text-red" : "text-gold"}`}>{fmtDeadline(bounty.deadline)}</p>
                <p className="text-[10px] font-mono text-sub/50">{fmtDate(bounty.deadline)}</p>
              </div>
            </div>
          )}
          <div className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border ${isFull ? "border-red/30 bg-red/5" : "border-border bg-surface"}`}>
            <svg className={`w-4 h-4 ${isFull ? "text-red" : "text-sub"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
            <div>
              <p className="text-[10px] text-sub/60 font-body">Submissions</p>
              <p className={`text-sm font-body font-600 ${isFull ? "text-red" : "text-text"}`}>
                {subs.length}{bounty.maxSubmissions > 0n ? ` / ${bounty.maxSubmissions}` : " / ∞"}
              </p>
            </div>
          </div>
        </div>

        <div className="divider" />

        {/* Description */}
        <div>
          <p className="text-[10px] uppercase tracking-widest text-sub/60 font-body mb-3">Description</p>
          <p className="text-text/80 font-body text-sm leading-relaxed whitespace-pre-wrap">{bounty.description}</p>
        </div>

        {/* Meta */}
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl bg-surface border border-border px-4 py-3">
            <p className="text-[10px] text-sub/60 font-body mb-1">Client</p>
            <a href={arcscanAddr(bounty.client)} target="_blank" rel="noopener noreferrer" className="font-mono text-sm text-gold hover:text-gold-dim transition-colors">{shortAddr(bounty.client)}</a>
            {isClient && <span className="ml-2 text-[10px] text-gold/50 font-body">(you)</span>}
          </div>
          <div className="rounded-xl bg-surface border border-border px-4 py-3">
            <p className="text-[10px] text-sub/60 font-body mb-1">Created</p>
            <p className="text-sm text-text font-body">{fmtDate(bounty.createdAt)}</p>
          </div>
        </div>

        {/* Share */}
        <div className="pt-2 flex gap-2">
          <a href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(`Just posted a ${fmtUSDC(bounty.amount)} USDC bounty on ArcBounty 🏗️\n\n"${bounty.title}"\n\nBuilt on Arc Testnet. #ArcNetwork #Web3`)}`}
            target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-surface border border-border text-sub text-sm font-body hover:border-gold/30 hover:text-text transition-all">
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" /></svg>
            Share on X
          </a>
        </div>
      </div>

      {/* Submissions */}
      <div className="card p-6">
        <h2 className="font-display font-600 text-text mb-1 flex items-center gap-2">
          Submissions <span className="text-sm text-sub font-body font-400">({subs.length})</span>
        </h2>
        <p className="text-sub text-xs font-body mb-5">Review each submission and approve the best one.</p>
        {subs.length === 0 ? (
          <div className="text-center py-10 rounded-xl border border-border bg-surface">
            <p className="text-sub font-body text-sm">No submissions yet. Be the first! 🚀</p>
          </div>
        ) : (
          <div className="space-y-3">
            {subs.map(s => <SubmissionRow key={String(s.id)} sub={s} bountyId={bounty.id} isClient={!!isClient} status={bounty.status} onDone={load} />)}
          </div>
        )}
      </div>

      {/* Actions */}
      {address && bounty.status === BountyStatus.Open && !isClient && (
        <SubmitPanel bountyId={bounty.id} alreadySubmitted={alreadySubmitted} isExpired={!!isExpired} isFull={!!isFull} maxSub={bounty.maxSubmissions} onDone={load} />
      )}
      {isClient && bounty.status === BountyStatus.Open && (
        <ClientActions bountyId={bounty.id} onDone={load} />
      )}

      {bounty.status === BountyStatus.Disputed && (
        <div className="rounded-2xl border border-red/30 bg-red/5 p-5">
          <p className="text-red font-display font-600 text-sm mb-1">Bounty Disputed</p>
          <p className="text-sub text-xs font-body">Contact the other party to resolve off-chain.</p>
        </div>
      )}
      {!address && (
        <div className="card p-6 text-center">
          <p className="text-sub font-body text-sm">Connect your wallet to interact with this bounty.</p>
        </div>
      )}
    </div>
  );
}

function SubmissionRow({ sub, bountyId, isClient, status, onDone }: { sub: Submission; bountyId: bigint; isClient: boolean; status: number; onDone: () => void }) {
  const { address } = useWallet();
  const [loading, setLoading] = useState(false);
  const [hash, setHash] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const isYou = address?.toLowerCase() === sub.contributor.toLowerCase();

  async function approve() {
    if (!address || !window.confirm("Approve and release USDC to this contributor?")) return;
    setLoading(true); setErr(null);
    try { const h = await txApproveWork(address, bountyId, sub.id); setHash(h as string); setTimeout(onDone, 3000); }
    catch (e: unknown) { setErr((e as { shortMessage?: string })?.shortMessage ?? "Error"); }
    finally { setLoading(false); }
  }

  return (
    <div className={`rounded-xl border p-4 ${sub.approved ? "border-green/30 bg-green/5" : "border-border bg-surface"}`}>
      {hash ? <TxToast hash={hash} /> : (
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <span className="font-mono text-sm text-gold">{shortAddr(sub.contributor)}</span>
              {isYou && <span className="text-[10px] text-gold/50 font-body">(you)</span>}
              {sub.approved && <span className="badge bg-green/10 border-green/20 text-green text-[10px]">🏆 Winner</span>}
              <span className="text-[10px] text-sub/40 font-mono">#{Number(sub.id) + 1}</span>
            </div>
            <a href={sub.url} target="_blank" rel="noopener noreferrer" className="text-text/80 text-sm font-body hover:text-gold transition-colors break-all flex items-start gap-1.5">
              <svg className="w-3.5 h-3.5 mt-0.5 shrink-0 text-sub" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
              {sub.url}
            </a>
            <p className="text-xs text-sub/50 font-body mt-1.5">{fmtDate(sub.submittedAt)}</p>
          </div>
          {isClient && status === BountyStatus.Open && !sub.approved && (
            <button onClick={approve} disabled={loading} className="btn-gold shrink-0 px-4 py-2 text-xs rounded-xl flex items-center gap-1.5 disabled:opacity-50">
              {loading ? <div className="w-3 h-3 border-2 border-bg/40 border-t-bg rounded-full spin" /> : "✓"} Approve
            </button>
          )}
        </div>
      )}
      {err && <p className="text-xs text-red font-body mt-2">{err}</p>}
    </div>
  );
}

function SubmitPanel({ bountyId, alreadySubmitted, isExpired, isFull, maxSub, onDone }: { bountyId: bigint; alreadySubmitted: boolean; isExpired: boolean; isFull: boolean; maxSub: bigint; onDone: () => void }) {
  const { address, connect } = useWallet();
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [hash, setHash] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!address) { connect(); return; }
    setLoading(true); setErr(null);
    try { const h = await txSubmitWork(address, bountyId, url.trim()); setHash(h as string); setTimeout(onDone, 3000); }
    catch (e: unknown) { setErr((e as { shortMessage?: string })?.shortMessage ?? "Error"); }
    finally { setLoading(false); }
  }

  return (
    <div className="card p-6">
      <h2 className="font-display font-600 text-text mb-1">Submit Your Work</h2>
      <p className="text-sub text-sm font-body mb-5">Share a link to your completed work.</p>
      {hash ? <TxToast hash={hash} msg="Submitted! Waiting for client review." /> :
        alreadySubmitted ? <div className="rounded-xl border border-green/30 bg-green/5 px-4 py-3 text-sm text-green font-body">✅ You already submitted. Waiting for client review.</div> :
        isExpired ? <div className="rounded-xl border border-red/30 bg-red/5 px-4 py-3 text-sm text-red font-body">⏰ This bounty has expired.</div> :
        isFull ? <div className="rounded-xl border border-red/30 bg-red/5 px-4 py-3 text-sm text-red font-body">🚫 Max submissions ({String(maxSub)}) reached.</div> : (
          <form onSubmit={submit} className="space-y-3">
            <input className="input" type="url" value={url} onChange={e => setUrl(e.target.value)} placeholder="https://github.com/you/repo/pull/1" required />
            {err && <p className="text-sm text-red font-body">{err}</p>}
            <button type="submit" disabled={loading || !url.trim()} className="w-full py-3 rounded-xl bg-yellow/10 border border-yellow/30 text-yellow font-body font-600 text-sm hover:bg-yellow/15 disabled:opacity-50 transition-all flex items-center justify-center gap-2">
              {loading ? <><div className="w-4 h-4 border-2 border-yellow/40 border-t-yellow rounded-full spin" />Submitting…</> : "🚀 Submit Work"}
            </button>
          </form>
        )
      }
    </div>
  );
}

function ClientActions({ bountyId, onDone }: { bountyId: bigint; onDone: () => void }) {
  const { address } = useWallet();
  const [loading, setLoading] = useState<string | null>(null);
  const [hash, setHash] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  async function act(fn: () => Promise<unknown>, label: string) {
    setLoading(label); setErr(null);
    try { const h = await fn(); setHash(h as string); setTimeout(onDone, 3000); }
    catch (e: unknown) { setErr((e as { shortMessage?: string })?.shortMessage ?? "Error"); }
    finally { setLoading(null); }
  }

  return (
    <div className="card p-6 space-y-3">
      <h2 className="font-display font-600 text-text mb-4">Client Actions</h2>
      {hash ? <TxToast hash={hash} /> : (
        <>
          <button onClick={() => window.confirm("Cancel and refund USDC to your wallet?") && act(() => txCancelBounty(address!, bountyId), "cancel")}
            disabled={!!loading} className="w-full py-3 rounded-xl bg-surface border border-border text-sub font-body font-500 text-sm hover:border-red/30 hover:text-red disabled:opacity-50 transition-all flex items-center justify-center gap-2">
            {loading === "cancel" ? <><div className="w-4 h-4 border-2 border-sub/40 border-t-sub rounded-full spin" />Processing…</> : "Cancel & Refund"}
          </button>
          {err && <p className="text-xs text-red font-body">{err}</p>}
        </>
      )}
    </div>
  );
}


