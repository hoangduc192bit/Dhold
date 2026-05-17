"use client";

import { useEffect, useState } from "react";

interface CircleKitWarningProps {
  onSandboxToggle?: (enabled: boolean) => void;
}

export default function CircleKitWarning({ onSandboxToggle }: CircleKitWarningProps) {
  const [hasKey, setHasKey] = useState(true);
  const [sandboxEnabled, setSandboxEnabled] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    // Check if key is configured
    const key = process.env.NEXT_PUBLIC_CIRCLE_KIT_KEY;
    setHasKey(!!key);

    // Initialize sandbox mode from localStorage
    if (!key) {
      const stored = localStorage.getItem("arc_sandbox_mode") === "true";
      setSandboxEnabled(stored);
      if (onSandboxToggle) {
        onSandboxToggle(stored);
      }
    }
  }, [onSandboxToggle]);

  const toggleSandbox = () => {
    const nextState = !sandboxEnabled;
    setSandboxEnabled(nextState);
    localStorage.setItem("arc_sandbox_mode", String(nextState));
    if (onSandboxToggle) {
      onSandboxToggle(nextState);
    }
  };

  const copyEnvCode = async () => {
    await navigator.clipboard.writeText("NEXT_PUBLIC_CIRCLE_KIT_KEY=your_circle_developer_kit_key");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (hasKey) return null;

  return (
    <div className="w-full max-w-2xl mx-auto mb-8 card p-6 sm:p-7 border border-yellow/20 bg-yellow/5 overflow-hidden animate-fade-in">
      <div className="absolute top-0 right-0 w-24 h-24 bg-yellow/5 rounded-full filter blur-xl pointer-events-none" />
      
      <div className="flex flex-col sm:flex-row gap-5 relative z-10">
        <div className="flex-shrink-0 w-12 h-12 rounded-2xl bg-yellow/10 border border-yellow/20 flex items-center justify-center text-yellow text-2xl font-mono">
          ⚠️
        </div>
        
        <div className="space-y-4 flex-1">
          <div className="space-y-1">
            <h3 className="font-display font-700 text-lg text-text">Circle App Kit Configuration Required</h3>
            <p className="text-sub text-xs leading-relaxed">
              To use real stablecoin swaps and bridges on the Arc Testnet, you need to configure a 
              <strong> Circle Developer Kit Key</strong>. Get one at <a href="https://developers.circle.com" target="_blank" rel="noopener noreferrer" className="text-gold underline hover:text-gold-dim transition-colors">developers.circle.com</a>.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-surface border border-border flex items-center justify-between gap-4 font-mono text-xs text-sub">
            <span className="truncate select-all text-text/80">
              NEXT_PUBLIC_CIRCLE_KIT_KEY=your_key_here
            </span>
            <button 
              onClick={copyEnvCode} 
              className="px-3 py-1.5 rounded-lg bg-gold/10 hover:bg-gold/20 text-gold hover:text-gold-dim transition-all text-[11px]"
            >
              {copied ? "Copied!" : "Copy"}
            </button>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2 border-t border-border/40">
            <div className="space-y-0.5">
              <span className="block text-xs font-semibold text-text">Developer Sandbox Mode</span>
              <span className="block text-[10px] text-sub">Simulate estimates and quotes safely without credentials.</span>
            </div>
            
            <button
              onClick={toggleSandbox}
              className={`px-4 py-2 rounded-xl text-xs font-semibold font-display tracking-wide transition-all border ${
                sandboxEnabled 
                  ? "bg-yellow/15 border-yellow/40 text-yellow hover:bg-yellow/20" 
                  : "bg-surface hover:bg-muted border-border text-sub hover:text-text"
              }`}
            >
              {sandboxEnabled ? "Sandbox: Enabled (Simulation)" : "Enable Sandbox Mode"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
