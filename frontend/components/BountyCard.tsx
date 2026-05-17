import Link from "next/link";
import { Bounty, fmtUSDC, shortAddr, fmtDate, fmtDeadline, BountyStatus } from "../lib/contract";
import StatusBadge from "./StatusBadge";
import TiltCard from "./TiltCard";

export default function BountyCard({ bounty }: { bounty: Bounty }) {
  const isExpired = bounty.deadline > 0n && BigInt(Math.floor(Date.now() / 1000)) > bounty.deadline;
  const deadlineText = fmtDeadline(bounty.deadline);

  return (
    <Link href={`/bounty/${bounty.id}`}>
      <TiltCard className="p-5 cursor-pointer group relative overflow-hidden">
        {/* Top shimmer line */}
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gold/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

        {/* Category + Status */}
        <div className="flex items-center justify-between mb-4">
          <span className="text-[10px] font-body font-600 uppercase tracking-widest text-sub bg-surface border border-border px-2.5 py-1 rounded-full">
            {bounty.category || "General"}
          </span>
          <StatusBadge status={bounty.status} size="sm" />
        </div>

        {/* ID + Title */}
        <p className="text-[10px] font-mono text-sub/60 mb-1.5 tabular">
          #{String(bounty.id).padStart(4, "0")}
        </p>
        <h3 className="font-display font-700 text-text text-base leading-snug line-clamp-2 mb-4 group-hover:text-gold transition-colors duration-200">
          {bounty.title}
        </h3>

        {/* Amount - hero number */}
        <div className="flex items-baseline gap-1.5 mb-5">
          <span className="font-display font-800 text-3xl text-gold-gradient tabular">{fmtUSDC(bounty.amount)}</span>
          <span className="text-sm text-sub font-body">USDC</span>
        </div>

        {/* Deadline + slots */}
        <div className="flex items-center gap-2 flex-wrap mb-4">
          {bounty.deadline > 0n && (
            <span className={`inline-flex items-center gap-1 text-[11px] font-body font-500 px-2.5 py-1 rounded-full ${isExpired ? "bg-red/10 text-red border border-red/20" : "bg-gold/8 text-gold border border-gold/20"}`}>
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              {deadlineText}
            </span>
          )}
          {bounty.maxSubmissions > 0n && (
            <span className="inline-flex items-center gap-1 text-[11px] font-body font-500 px-2.5 py-1 rounded-full bg-surface border border-border text-sub">
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0" /></svg>
              Max {String(bounty.maxSubmissions)}
            </span>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-border/60">
          <div className="flex items-center gap-1.5">
            <div className="w-5 h-5 rounded-full bg-gold/10 border border-gold/20 flex items-center justify-center">
              <span className="text-[8px] font-mono text-gold font-600">{bounty.client.slice(2, 4).toUpperCase()}</span>
            </div>
            <span className="text-xs font-mono text-sub">{shortAddr(bounty.client)}</span>
          </div>
          <div className="flex items-center gap-1 text-sub group-hover:text-gold transition-colors duration-200">
            <span className="text-xs font-body">{fmtDate(bounty.createdAt)}</span>
            <svg className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform duration-200" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
          </div>
        </div>
      </TiltCard>
    </Link>
  );
}
