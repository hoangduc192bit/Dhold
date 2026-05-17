"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import ProfileMenu from "./ProfileMenu";

const NAV = [
  { href: "/bounties", label: "Jobs" },
  { href: "/pay", label: "Pay Link" },
  { href: "/swap", label: "Swap" },
  { href: "/bridge", label: "Bridge" },
  { href: "/faucet", label: "Faucet" },
  { href: "/leaderboard", label: "Leaderboard" },
  { href: "/dashboard", label: "Dashboard" },
];

export default function Navbar() {
  const path = usePathname();
  return (
    <header className="sticky top-0 z-50 glass border-b border-border/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        <Link href="/" className="flex items-center gap-2.5 shrink-0">
          <div className="relative w-8 h-8">
            <div className="absolute inset-0 rounded-lg bg-gold-gradient opacity-20 blur-sm" />
            <div className="relative w-8 h-8 rounded-lg bg-gold-gradient flex items-center justify-center">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M8 1L14.5 4.75V11.25L8 15L1.5 11.25V4.75L8 1Z" stroke="#08090E" strokeWidth="1.5" strokeLinejoin="round" fill="none"/><path d="M8 5L11 6.75V10.25L8 12L5 10.25V6.75L8 5Z" fill="#08090E"/></svg>
            </div>
          </div>
          <div>
            <span className="font-display font-800 text-text tracking-tight text-sm">Arc</span>
            <span className="font-display font-800 text-gold tracking-tight text-sm">Bounty</span>
          </div>
        </Link>

        <nav className="hidden lg:flex items-center gap-1">
          {NAV.map(n => {
            const active = path === n.href || path?.startsWith(n.href + "/");
            return (
              <Link key={n.href} href={n.href} className={`px-3 py-2 rounded-xl text-sm font-body font-500 transition-all duration-150 ${active ? "bg-gold/10 text-gold" : "text-sub hover:text-text hover:bg-surface"}`}>{n.label}</Link>
            );
          })}
        </nav>

        <ProfileMenu />
      </div>

      <nav className="lg:hidden flex border-t border-border/40 px-2 py-2 gap-1 overflow-x-auto">
        {NAV.map(n => {
          const active = path === n.href || path?.startsWith(n.href + "/");
          return <Link key={n.href} href={n.href} className={`px-3 py-1.5 rounded-lg text-xs font-body text-center whitespace-nowrap transition-all ${active ? "bg-gold/10 text-gold" : "text-sub"}`}>{n.label}</Link>;
        })}
      </nav>
    </header>
  );
}
