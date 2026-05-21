"use client";
import { useState } from "react";
import { useWallet } from "../../hooks/useWallet";

export default function PayPage() {
  const { address, connected, connect } = useWallet();
  const [amount, setAmount] = useState("");
  const [desc, setDesc] = useState("");
  const [senderName, setSenderName] = useState("");
  const [generated, setGenerated] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  function generate() {
    if (!address || !amount) return;
    const params = new URLSearchParams({
      to: address,
      amount,
      desc: desc || "USDC Payment",
      name: senderName || "ArcBounty User",
    });
    const link = `${window.location.origin}/pay/link?${params.toString()}`;
    setGenerated(link);
  }

  function copy() {
    if (!generated) return;
    navigator.clipboard.writeText(generated);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function shareX() {
    if (!generated) return;
    const text = `Send me ${amount} USDC on Arc Network 💸\n\n${generated}\n\n#ArcNetwork #USDC`;
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`, "_blank");
  }

  async function downloadQR() {
    if (!generated) return;
    try {
      const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(generated)}&color=0-0-0`;
      const response = await fetch(qrUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `arcbounty-paylink-qr.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Failed to download QR code:", err);
      window.open(`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(generated)}&color=0-0-0`, "_blank");
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-12 space-y-8">
      {/* Header */}
      <div>
        <h1 className="font-display font-800 text-4xl text-text mb-2">Payment Link</h1>
        <p className="text-sub font-body">Create a link — share it — get paid in USDC instantly.</p>
      </div>

      {/* How it works */}
      <div className="flex gap-4 overflow-x-auto pb-2">
        {[
          { icon: "✏️", label: "Set amount & description" },
          { icon: "🔗", label: "Generate your link" },
          { icon: "📤", label: "Share with anyone" },
          { icon: "💰", label: "Receive USDC instantly" },
        ].map((s, i) => (
          <div key={i} className="flex items-center gap-2 shrink-0">
            <div className="flex flex-col items-center gap-1.5">
              <span className="text-xl">{s.icon}</span>
              <p className="text-[10px] text-sub font-body text-center w-20 leading-snug">{s.label}</p>
            </div>
            {i < 3 && <svg className="w-4 h-4 text-border shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>}
          </div>
        ))}
      </div>

      {!connected ? (
        <div className="card p-8 text-center space-y-4">
          <p className="text-sub font-body text-sm">Connect your wallet to generate a payment link.</p>
          <button onClick={connect} className="btn-gold px-6 py-3 text-sm">Connect Wallet</button>
        </div>
      ) : (
        <>
          {/* Form */}
          <div className="card p-6 space-y-5">
            <h3 className="font-display font-600 text-text">Create Payment Request</h3>

            <div>
              <label className="block text-xs text-sub/70 font-body mb-2">Amount (USDC) <span className="text-red">*</span></label>
              <div className="relative">
                <input className="input font-mono pr-20" type="number" value={amount}
                  onChange={e => setAmount(e.target.value)} placeholder="0.00" min="0.001" step="any" required />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-gold font-body font-600">USDC</span>
              </div>
            </div>

            <div>
              <label className="block text-xs text-sub/70 font-body mb-2">Description</label>
              <input className="input" value={desc} onChange={e => setDesc(e.target.value)}
                placeholder="e.g. Invoice #001 — UI Design work" />
            </div>

            <div>
              <label className="block text-xs text-sub/70 font-body mb-2">Your name / business</label>
              <input className="input" value={senderName} onChange={e => setSenderName(e.target.value)}
                placeholder="e.g. Nguyen Van A" />
            </div>

            <div className="rounded-xl bg-surface border border-border px-4 py-3">
              <p className="text-[10px] text-sub/60 font-body mb-1">Payments will be sent to</p>
              <p className="font-mono text-sm text-gold break-all">{address}</p>
            </div>

            <button onClick={generate} disabled={!amount}
              className="btn-gold w-full py-3.5 rounded-2xl text-sm disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
              </svg>
              Generate Payment Link
            </button>
          </div>

          {/* Generated link */}
          {generated && (
            <div className="card p-6 space-y-4 animate-fade-up">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-green/15 flex items-center justify-center">
                  <svg className="w-4 h-4 text-green" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                </div>
                <p className="font-display font-600 text-green text-sm">Payment Link & QR Code ready!</p>
              </div>

              <div className="rounded-xl bg-surface border border-border p-4">
                <p className="text-[10px] text-sub/60 font-body mb-2">Your link</p>
                <p className="font-mono text-xs text-text break-all leading-relaxed">{generated}</p>
              </div>

              {/* QR Code Segment */}
              <div className="flex flex-col items-center justify-center p-6 bg-surface border border-border rounded-xl space-y-4">
                <p className="text-xs text-sub/80 font-body font-500">Scan to pay instantly on Arc Testnet</p>
                <div className="relative p-4 bg-white rounded-2xl border-2 border-gold/30 shadow-[0_0_20px_rgba(240,196,61,0.15)] transition-all hover:scale-105 duration-300">
                  <img 
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(generated)}&color=0-0-0`}
                    alt="Payment QR Code"
                    className="w-[180px] h-[180px] rounded-lg"
                  />
                  {/* Styled Gold corners */}
                  <div className="absolute top-1.5 left-1.5 w-3.5 h-3.5 border-t-2 border-l-2 border-gold rounded-tl-sm" />
                  <div className="absolute top-1.5 right-1.5 w-3.5 h-3.5 border-t-2 border-r-2 border-gold rounded-tr-sm" />
                  <div className="absolute bottom-1.5 left-1.5 w-3.5 h-3.5 border-b-2 border-l-2 border-gold rounded-bl-sm" />
                  <div className="absolute bottom-1.5 right-1.5 w-3.5 h-3.5 border-b-2 border-r-2 border-gold rounded-br-sm" />
                </div>
                <button 
                  onClick={downloadQR}
                  className="text-xs text-gold hover:text-gold-dim underline flex items-center gap-1.5 font-body transition-colors hover:brightness-110 active:scale-95"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Download QR Code
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <button onClick={copy}
                  className={`py-3 rounded-xl text-sm font-body font-500 border transition-all flex items-center justify-center gap-2 ${copied ? "bg-green/10 border-green/30 text-green" : "bg-surface border-border text-sub hover:text-text hover:border-gold/30"}`}>
                  {copied
                    ? <><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>Copied!</>
                    : <><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>Copy Link</>}
                </button>
                <button onClick={shareX}
                  className="py-3 rounded-xl text-sm font-body font-500 border border-border bg-surface text-sub hover:text-text hover:border-gold/30 transition-all flex items-center justify-center gap-2">
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" /></svg>
                  Share on X
                </button>
              </div>

              <p className="text-xs text-sub/50 font-body text-center">
                Anyone with this link can send you {amount} USDC directly to your wallet.
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
