"use client";

import { createContext, ReactNode, useContext, useEffect, useMemo, useState } from "react";

type Theme = "dark" | "light";

type ThemeCtx = {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
};

const Ctx = createContext<ThemeCtx | null>(null);

export default function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("dark");

  useEffect(() => {
    const stored = localStorage.getItem("arcbounty_theme") as Theme | null;
    const next = stored === "light" || stored === "dark" ? stored : "dark";
    setThemeState(next);
    document.documentElement.dataset.theme = next;
  }, []);

  function setTheme(theme: Theme) {
    setThemeState(theme);
    document.documentElement.dataset.theme = theme;
    localStorage.setItem("arcbounty_theme", theme);
  }

  const value = useMemo(() => ({
    theme,
    setTheme,
    toggleTheme: () => setTheme(theme === "dark" ? "light" : "dark"),
  }), [theme]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useTheme() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useTheme must be used inside ThemeProvider");
  return ctx;
}
