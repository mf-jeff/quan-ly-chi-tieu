"use client";

import { useEffect, useState } from "react";

function Coin({ left, delay, duration, size, opacity, spinDir }: { left: number; delay: number; duration: number; size: number; opacity: number; spinDir: string }) {
  return (
    <div
      style={{
        position: "absolute",
        left: `${left}%`,
        top: "-40px",
        animation: `coinFall ${duration}s ${delay}s linear infinite`,
        opacity,
      }}
    >
      <div style={{ width: size, height: size, animation: `coinSpin 3s linear infinite ${spinDir}` }}>
        <svg width={size} height={size} viewBox="0 0 40 40">
          <circle cx="20" cy="20" r="18" fill="#f59e0b" stroke="#d97706" strokeWidth="2" />
          <circle cx="20" cy="20" r="14" fill="none" stroke="#fbbf24" strokeWidth="1" />
          <text x="20" y="26" textAnchor="middle" fontSize="16" fontWeight="bold" fill="#92400e" fontFamily="sans-serif">₫</text>
          <ellipse cx="13" cy="13" rx="4" ry="6" fill="#fde68a" opacity="0.4" transform="rotate(-30 13 13)" />
        </svg>
      </div>
    </div>
  );
}

function CoinRainEffect() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  const coins = Array.from({ length: 15 }, (_, i) => ({
    left: (i * 7 + 2) % 100,
    delay: (i * 1.2) % 8,
    duration: 7 + (i % 5) * 2,
    size: 18 + (i % 4) * 5,
    opacity: 0.12 + (i % 3) * 0.06,
    spinDir: i % 2 === 0 ? "normal" : "reverse",
  }));

  return (
    <div style={{ position: "fixed", inset: 0, pointerEvents: "none", overflow: "hidden", zIndex: 0 }}>
      {coins.map((c, i) => <Coin key={i} {...c} />)}
    </div>
  );
}

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="w-full relative min-h-screen">
      <CoinRainEffect />
      <div style={{ position: "relative", zIndex: 1 }}>{children}</div>
    </div>
  );
}
