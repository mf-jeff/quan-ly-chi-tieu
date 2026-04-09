"use client";

import { createContext, useContext, useEffect, useState } from "react";

type Theme = "light" | "dark";

const ThemeContext = createContext<{
  theme: Theme;
  toggle: () => void;
}>({ theme: "light", toggle: () => {} });

export function useTheme() {
  return useContext(ThemeContext);
}

export default function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>("dark");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("theme") as Theme | null;
    setTheme(saved || "dark");
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    // Add transitioning class for smooth color change
    document.documentElement.classList.add("transitioning");
    document.documentElement.classList.toggle("dark", theme === "dark");
    localStorage.setItem("theme", theme);

    // Remove transitioning class after animation
    const timeout = setTimeout(() => {
      document.documentElement.classList.remove("transitioning");
    }, 400);
    return () => clearTimeout(timeout);
  }, [theme, mounted]);

  const toggle = () => setTheme((t) => (t === "light" ? "dark" : "light"));

  // Prevent flash of wrong theme
  if (!mounted) {
    return <div style={{ visibility: "hidden" }}>{children}</div>;
  }

  return (
    <ThemeContext.Provider value={{ theme, toggle }}>
      {children}
    </ThemeContext.Provider>
  );
}
