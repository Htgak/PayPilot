"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

export type Theme = "light" | "dark" | "system";
interface ThemeContextType { theme: "light" | "dark"; preference: Theme; setTheme: (theme: Theme) => void; toggleTheme: () => void; }
const ThemeContext = createContext<ThemeContextType>({ theme: "light", preference: "light", setTheme: () => {}, toggleTheme: () => {} });

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [preference, setPreference] = useState<Theme>("light");
  const [theme, setResolvedTheme] = useState<"light" | "dark">("light");
  useEffect(() => {
    const saved = localStorage.getItem("paypilot-theme") as Theme | null;
    const initial: Theme = saved === "light" || saved === "dark" || saved === "system" ? saved : "light";
    const apply = (pref: Theme) => {
      const resolved = pref === "system" ? (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light") : pref;
      setResolvedTheme(resolved);
      document.documentElement.classList.toggle("dark", resolved === "dark");
    };
    setPreference(initial);
    apply(initial);
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = () => { if (localStorage.getItem("paypilot-theme") === "system") apply("system"); };
    media.addEventListener("change", handleChange);
    return () => media.removeEventListener("change", handleChange);
  }, []);
  const setTheme = (next: Theme) => {
    setPreference(next);
    localStorage.setItem("paypilot-theme", next);
    const resolved = next === "system" ? (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light") : next;
    setResolvedTheme(resolved);
    document.documentElement.classList.toggle("dark", resolved === "dark");
  };
  const toggleTheme = () => setTheme(theme === "dark" ? "light" : "dark");
  return <ThemeContext.Provider value={{ theme, preference, setTheme, toggleTheme }}>{children}</ThemeContext.Provider>;
}
export const useTheme = () => useContext(ThemeContext);
