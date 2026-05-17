"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useWallet } from "../../hooks/useWallet";
import { txCreateBounty, CATEGORIES, CONTRACT_ADDRESS, fmtUSDC } from "../../lib/contract";
import { parseEther } from "viem";
import TxToast from "../../components/TxToast";

export default function CreatePage() {
  const router = useRouter();
  const { address, connected, connect } = useWallet();
  const [form, setForm] = useState({ title: "", description: "", category: "Development", amount: "", deadlineDate: "", deadlineTime: "23:59", maxSub: "0" });
  const [loading, setLoading] = useState(false);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));
  const noContract = !CONTRACT_ADDRESS || CONTRACT_ADDRESS === "0x0";

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!address) { connect(); return; }
    setLoading(true); setError(null);
    try {
      let deadline = BigInt(0);
      if (form.deadlineDate) {
        const dt = new Date(`${form.deadlineDate}T${form.deadlineTime}:00`);
        deadline = BigInt(Math.floor(dt.getTime() / 1000));
      }
      const hash = await txCreateBounty(address, form.title.trim(), form.description.trim(), form.category, deadline, BigInt(parseInt(form.maxSub) || 0), form.amount);
      setTxHash(hash);
      setTimeout(() => router.push("/bounties"), 4000);
    } catch (err: unknown) {
      setError((err as { shortMessage?: string })?.shortMessage ?? (err as { message?: string })?.message ?? "Transaction failed");
    } finally { setLoading(false); }
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
      {/* Header */}
      <div className="mb-10">
        <h1 className="font-display font-800 text-4xl text-text mb-2">Post a Bounty</h1>
        <p className="text-sub font-body">Lock USDC and let Arc builders compete to work for you.</p>
      </div>

      {noContract && (
        <div className="rounded-2xl border border-yellow/30 bg-yellow/5 p-5 mb-8">
          <p className="text-yellow text-sm font-body">⚠️ Set <code className="font-mono text-xs bg-surface px-1.5 py-0.5 rounded">NEXT_PUBLIC_CONTRACT_ADDRESS</code> in .env.local</p>
        </div>
      )}

      {txHash ? (
        <TxToast hash={txHash} msg="Bounty created! Redirecting to bounties…" />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          {/* Form */}
          <div className="lg:col-span-3">
            <form onSubmit={submit} className="space-y-6">
              {/* Title */}
              <div>
                <label className="block text-sm font-body font-500 text-sub mb-2">Bounty Title <span className="text-red">*</span></label>
                <input className="input" value={form.title} onChange={e => set("title", e.target.value)} placeholder="e.g. Build a wallet tracker CLI for Arc" maxLength={100} required />
                <p className="text-right text-xs text-sub/50 mt-1 font-mono">{form.title.length}/100</p>
              </div>

              {/* Category */}
              <div>
                <label className="block text-sm font-body font-500 text-sub mb-2">Category</label>
                <div className="flex flex-wrap gap-2">
                  {CATEGORIES.map(c => (
                    <button key={c} type="button" onClick={() => set("category", c)}
                      className={`px-3 py-1.5 rounded-xl text-sm font-body font-500 border transition-all ${form.category === c ? "bg-gold/10 text-gold border-gold/30" : "bg-surface border-border text-sub hover:text-text"}`}>
                      {c}
                    </button>
                  ))}
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-body font-500 text-sub mb-2">Description <span className="text-red">*</span></label>
                <textarea className="input resize-none" rows={5} value={form.description} onChange={e => set("description", e.target.value)}
                  placeholder="Describe the work required, acceptance criteria, deliverables, and any relevant links…" required />
              </div>

              {/* Amount */}
              <div>
                <label className="block text-sm font-body font-500 text-sub mb-2">Reward Amount <span className="text-red">*</span></label>
                <div className="relative">
                  <input className="input pr-20 font-mono" type="number" value={form.amount} onChange={e => set("amount", e.target.value)}
                    placeholder="0.00" min="0.001" step="any" required />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-gold font-body font-600">USDC</span>
                </div>
                <p className="text-xs text-sub/60 mt-1.5 font-body">This amount is locked until you approve a submission or cancel.</p>
              </div>

              {/* Deadline */}
              <div>
                <label className="block text-sm font-body font-500 text-sub mb-2">Deadline <span className="text-sub/50 font-400">(optional)</span></label>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs text-sub/60 mb-1.5 font-body">Date</p>
                    <input className="input" type="date" value={form.deadlineDate} onChange={e => set("deadlineDate", e.target.value)} min={new Date().toISOString().slice(0, 10)} />
                  </div>
                  <div>
                    <p className="text-xs text-sub/60 mb-1.5 font-body">Time</p>
                    <input className="input" type="time" value={form.deadlineTime} onChange={e => set("deadlineTime", e.target.value)} />
                  </div>
                </div>
              </div>

              {/* Max submissions */}
              <div>
                <label className="block text-sm font-body font-500 text-sub mb-2">Max Submissions <span className="text-sub/50 font-400">(0 = unlimited)</span></label>
                <input className="input font-mono" type="number" value={form.maxSub} onChange={e => set("maxSub", e.target.value)} min="0" step="1" />
              </div>

              {/* Error */}
              {error && <div className="rounded-xl border border-red/30 bg-red/5 px-4 py-3 text-sm text-red font-body">{error}</div>}

              {/* Submit */}
              {!connected ? (
                <button type="button" onClick={connect} className="w-full py-4 rounded-2xl bg-surface border border-border text-sub font-body font-500 hover:border-gold/30 hover:text-text transition-all">
                  Connect Wallet to Continue
                </button>
              ) : (
                <button type="submit" disabled={loading || !form.title || !form.description || !form.amount}
                  className="btn-gold w-full py-4 rounded-2xl text-sm flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed">
                  {loading
                    ? <><div className="w-4 h-4 border-2 border-bg/40 border-t-bg rounded-full spin" />Creating Bounty…</>
                    : <>
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
                        Post Bounty & Lock {form.amount || "0"} USDC
                      </>
                  }
                </button>
              )}
            </form>
          </div>

          {/* Preview */}
          <div className="lg:col-span-2">
            <div className="sticky top-24">
              <p className="text-xs font-body font-600 text-sub uppercase tracking-wider mb-3">Preview</p>
              <div className="card p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-body font-600 uppercase tracking-widest text-sub bg-surface border border-border px-2.5 py-1 rounded-full">{form.category}</span>
                  <span className="badge bg-gold/10 border border-gold/20 text-gold text-[10px]"><span className="w-1.5 h-1.5 rounded-full bg-gold dot-pulse" />Open</span>
                </div>
                <div>
                  <p className="text-[10px] font-mono text-sub/50 mb-1">#0000</p>
                  <h3 className="font-display font-700 text-text text-base leading-snug">{form.title || "Your bounty title…"}</h3>
                </div>
                <div className="flex items-baseline gap-1.5">
                  <span className="font-display font-800 text-3xl text-gold-gradient">{form.amount ? parseFloat(form.amount).toLocaleString("en-US", { minimumFractionDigits: 2 }) : "0.00"}</span>
                  <span className="text-sm text-sub">USDC</span>
                </div>
                {form.deadlineDate && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-body font-500 px-2.5 py-1 rounded-full bg-gold/8 text-gold border border-gold/20">
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    {new Date(`${form.deadlineDate}`).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                  </span>
                )}
                <p className="text-sub text-sm font-body leading-relaxed line-clamp-4">{form.description || "Your description will appear here…"}</p>
              </div>

              {/* Info box */}
              <div className="mt-4 rounded-2xl border border-gold/15 bg-gold/4 p-4">
                <p className="text-xs font-body text-gold font-500 mb-2">💡 How escrow works</p>
                <p className="text-xs text-sub font-body leading-relaxed">Your USDC is locked in a smart contract. It's released only when you approve a submission — or returned if you cancel.</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
