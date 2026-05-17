/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: "var(--bg)",
        surface: "var(--surface)",
        card: "var(--card)",
        border: "var(--border)",
        gold: "var(--gold)",
        "gold-dim": "var(--gold-dim)",
        cyan: "#22D3EE",
        green: "#10B981",
        red: "#F43F5E",
        yellow: "#FBBF24",
        blue: "#6366F1",
        sub: "var(--sub)",
        muted: "var(--muted)",
        text: "var(--text)",
      },
      fontFamily: {
        display: ["'Space Grotesk'", "sans-serif"],
        body: ["'Inter'", "sans-serif"],
        mono: ["'JetBrains Mono'", "monospace"],
      },
      backgroundImage: {
        "noise": "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.04'/%3E%3C/svg%3E\")",
        "grid": "linear-gradient(rgba(245,197,66,0.04) 1px,transparent 1px),linear-gradient(90deg,rgba(245,197,66,0.04) 1px,transparent 1px)",
        "hero-glow": "radial-gradient(ellipse 70% 40% at 50% 0%,rgba(245,197,66,0.08) 0%,transparent 70%)",
        "card-shine": "linear-gradient(135deg,rgba(245,197,66,0.04) 0%,transparent 50%)",
        "gold-gradient": "linear-gradient(135deg,#F5C542,#C9A030)",
      },
      backgroundSize: { grid: "48px 48px" },
      boxShadow: {
        gold: "0 0 0 1px rgba(245,197,66,0.2), 0 4px 24px rgba(245,197,66,0.08)",
        "gold-lg": "0 0 0 1px rgba(245,197,66,0.3), 0 8px 40px rgba(245,197,66,0.15)",
        card: "0 1px 0 rgba(255,255,255,0.03) inset, 0 4px 24px rgba(0,0,0,0.4)",
        glow: "0 0 30px rgba(245,197,66,0.12)",
      },
      animation: {
        "fade-up": "fadeUp 0.5s ease forwards",
        "fade-in": "fadeIn 0.4s ease forwards",
        "pulse-gold": "pulseGold 2s ease-in-out infinite",
        "shimmer": "shimmer 1.5s infinite",
        "spin-slow": "spin 3s linear infinite",
      },
      keyframes: {
        fadeUp: { from: { opacity: "0", transform: "translateY(16px)" }, to: { opacity: "1", transform: "translateY(0)" } },
        fadeIn: { from: { opacity: "0" }, to: { opacity: "1" } },
        pulseGold: { "0%,100%": { boxShadow: "0 0 0 0 rgba(245,197,66,0.3)" }, "50%": { boxShadow: "0 0 0 8px rgba(245,197,66,0)" } },
        shimmer: { "0%": { backgroundPosition: "-200% 0" }, "100%": { backgroundPosition: "200% 0" } },
      },
    },
  },
  plugins: [],
};
