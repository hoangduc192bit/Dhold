"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useWallet } from "../hooks/useWallet";
import { arcscanAddr, shortAddr } from "../lib/contract";
import { useTheme } from "./ThemeProvider";
import CustomSelect from "./CustomSelect";

export default function ProfileMenu() {
  const { address, connected, correctNetwork, balance, connecting, connect, switchNetwork } = useWallet();
  const { theme, toggleTheme } = useTheme();
  const [open, setOpen] = useState(false);
  const [discord, setDiscord] = useState("");
  const [xName, setXName] = useState("");
  const [role, setRole] = useState("Freelancer");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setDiscord(localStorage.getItem("arc_profile_discord") || "");
    setXName(localStorage.getItem("arc_profile_x") || "");
    setRole(localStorage.getItem("arc_profile_role") || "Freelancer");
  }, []);

  function save(key: string, value: string) {
    localStorage.setItem(key, value);
    if (key === "arc_profile_discord") setDiscord(value);
    if (key === "arc_profile_x") setXName(value);
    if (key === "arc_profile_role") setRole(value);
  }

  async function copyAddress() {
    if (!address) return;
    await navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div className="relative shrink-0">
      <button onClick={() => setOpen(v => !v)} className="btn-ghost px-4 py-2 text-sm flex items-center gap-2">
        <span>Profile</span>
        {connected && address ? <span className="hidden sm:inline font-mono text-xs text-gold/80">{shortAddr(address)}</span> : <span className="hidden sm:inline text-xs text-sub">Connect</span>}
      </button>

      {open && (
        <div className="absolute right-0 mt-3 w-[360px] max-w-[calc(100vw-24px)] rounded-3xl border border-border bg-card shadow-2xl p-5 z-[999]">
          <div className="flex items-start justify-between gap-3 mb-4">
            <div>
              <p className="font-display font-800 text-text text-lg">Profile</p>
              <p className="text-sub text-xs font-body">Identity, wallet and quick actions</p>
            </div>
            <button onClick={() => setOpen(false)} className="w-8 h-8 rounded-xl bg-surface border border-border text-sub hover:text-text">×</button>
          </div>

          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-sub/70 font-body mb-1.5">Discord</label>
                <input className="input" value={discord} onChange={e => save("arc_profile_discord", e.target.value)} placeholder="Dhold#0000" />
              </div>
              <div>
                <label className="block text-xs text-sub/70 font-body mb-1.5">X</label>
                <input className="input" value={xName} onChange={e => save("arc_profile_x", e.target.value)} placeholder="@Dhold" />
              </div>
            </div>

            <div>
              <label className="block text-xs text-sub/70 font-body mb-1.5">Main role</label>
              <CustomSelect 
                value={role} 
                onChange={val => save("arc_profile_role", val)} 
                options={["Freelancer", "Client", "Builder", "Agent Operator"]} 
              />
            </div>

            <div className="rounded-2xl border border-border bg-surface p-4">
              <div className="flex items-center justify-between gap-3 mb-3">
                <p className="text-xs text-sub/70 font-body">Wallet</p>
                {connected && address && <button onClick={copyAddress} className="text-xs text-gold hover:text-gold-dim">{copied ? "Copied!" : "Copy"}</button>}
              </div>

              {connected && address ? (
                <div className="space-y-3">
                  <a href={arcscanAddr(address)} target="_blank" rel="noopener noreferrer" className="font-mono text-sm text-text break-all hover:text-gold">{address}</a>
                  <div className="flex items-center justify-between rounded-xl border border-gold/15 bg-gold/5 px-4 py-3">
                    <span className="text-xs text-sub">Balance</span>
                    <span className="font-mono text-sm text-gold">{balance} USDC</span>
                  </div>
                  {!correctNetwork && <button onClick={switchNetwork} className="btn-gold w-full py-2.5 text-sm">Switch to Arc Testnet</button>}
                </div>
              ) : (
                <button onClick={connect} disabled={connecting} className="btn-gold w-full py-3 text-sm">{connecting ? "Connecting..." : "Connect Wallet"}</button>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button onClick={toggleTheme} className="btn-ghost py-3 text-sm">{theme === "dark" ? "Light mode" : "Dark mode"}</button>
              <Link href="/leaderboard" className="btn-ghost py-3 text-sm text-center">Leaderboard</Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
