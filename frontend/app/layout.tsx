import type { Metadata } from "next";
import "./globals.css";
import { WalletProvider } from "../hooks/useWallet";
import Navbar from "../components/Navbar";
import ThemeProvider from "../components/ThemeProvider";
import CustomCursor from "../components/CustomCursor";
import CanvasBackground from "../components/CanvasBackground";

export const metadata: Metadata = {
  title: "ArcBounty — USDC Freelance Infrastructure on Arc",
  description: "Jobs, payment links, Circle faucet, swap, bridge, reviews and leaderboard for the Arc contributor economy.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen bg-bg text-text">
        <ThemeProvider>
          <WalletProvider>
            <CustomCursor />
            <CanvasBackground />
            <Navbar />
            <main>{children}</main>
            <footer className="py-2 text-center opacity-40 hover:opacity-100 transition-opacity">
              <p className="text-[10px] font-mono text-sub">
                ArcBounty · Circle App Kit · Arc Testnet
              </p>
            </footer>
          </WalletProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
