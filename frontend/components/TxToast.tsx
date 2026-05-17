import { arcscanTx } from "../lib/contract";

export default function TxToast({ hash, msg }: { hash: string; msg?: string }) {
  return (
    <div className="rounded-2xl border border-green/30 bg-green/5 p-5 space-y-3 animate-fade-up">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-green/15 flex items-center justify-center shrink-0">
          <svg className="w-5 h-5 text-green" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <div>
          <p className="text-green font-display font-700 text-sm">Transaction sent!</p>
          {msg && <p className="text-sub text-xs font-body mt-0.5">{msg}</p>}
        </div>
      </div>
      <div className="rounded-xl bg-surface border border-border px-4 py-3">
        <p className="text-xs text-sub font-body mb-1">Tx Hash</p>
        <p className="font-mono text-xs text-text break-all leading-relaxed">{hash}</p>
      </div>
      <a href={arcscanTx(hash)} target="_blank" rel="noopener noreferrer"
        className="inline-flex items-center gap-1.5 text-xs text-gold hover:text-gold-dim font-body transition-colors">
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
        </svg>
        View on Arcscan
      </a>
    </div>
  );
}
