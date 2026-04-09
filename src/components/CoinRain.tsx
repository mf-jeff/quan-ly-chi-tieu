"use client";

import { useEffect, useState } from "react";

interface Coin {
  id: number;
  left: number;
  delay: number;
  duration: number;
  size: number;
  opacity: number;
  spin: number;
}

export default function CoinRain() {
  const [coins, setCoins] = useState<Coin[]>([]);

  useEffect(() => {
    const generated: Coin[] = Array.from({ length: 20 }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      delay: Math.random() * 8,
      duration: 6 + Math.random() * 8,
      size: 16 + Math.random() * 20,
      opacity: 0.15 + Math.random() * 0.2,
      spin: Math.random() > 0.5 ? 1 : -1,
    }));
    setCoins(generated);
  }, []);

  if (coins.length === 0) return null;

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
      {coins.map((coin) => (
        <div
          key={coin.id}
          className="absolute animate-coin-fall"
          style={{
            left: `${coin.left}%`,
            animationDelay: `${coin.delay}s`,
            animationDuration: `${coin.duration}s`,
            opacity: coin.opacity,
          }}
        >
          <svg
            width={coin.size}
            height={coin.size}
            viewBox="0 0 40 40"
            className="animate-coin-spin"
            style={{
              animationDuration: `${2 + Math.random() * 3}s`,
              animationDirection: coin.spin > 0 ? "normal" : "reverse",
            }}
          >
            {/* Outer ring */}
            <circle cx="20" cy="20" r="18" fill="#f59e0b" stroke="#d97706" strokeWidth="2" />
            {/* Inner ring */}
            <circle cx="20" cy="20" r="14" fill="none" stroke="#fbbf24" strokeWidth="1" />
            {/* Dollar sign */}
            <text x="20" y="26" textAnchor="middle" fontSize="16" fontWeight="bold" fill="#92400e" fontFamily="sans-serif">$</text>
            {/* Shine */}
            <ellipse cx="13" cy="13" rx="4" ry="6" fill="#fde68a" opacity="0.4" transform="rotate(-30 13 13)" />
          </svg>
        </div>
      ))}
    </div>
  );
}
