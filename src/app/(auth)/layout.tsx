"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

const STYLE = `
@keyframes cf{0%{transform:translateY(-60px);opacity:0}10%{opacity:1}90%{opacity:1}100%{transform:translateY(105vh);opacity:0}}
@keyframes cs{0%{transform:rotateY(0)}100%{transform:rotateY(360deg)}}
`;

function CoinSVG({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40">
      <circle cx="20" cy="20" r="18" fill="#f59e0b" stroke="#d97706" strokeWidth="2" />
      <circle cx="20" cy="20" r="14" fill="none" stroke="#fbbf24" strokeWidth="1" />
      <text x="20" y="26" textAnchor="middle" fontSize="16" fontWeight="bold" fill="#92400e" fontFamily="sans-serif">₫</text>
      <ellipse cx="13" cy="13" rx="4" ry="6" fill="#fde68a" opacity="0.4" transform="rotate(-30 13 13)" />
    </svg>
  );
}

function CoinRainPortal() {
  const [el, setEl] = useState<HTMLElement | null>(null);

  useEffect(() => {
    const div = document.createElement("div");
    div.id = "coin-rain";
    div.style.cssText = "position:fixed;inset:0;pointer-events:none;overflow:hidden;z-index:0";
    document.body.appendChild(div);

    const style = document.createElement("style");
    style.textContent = STYLE;
    document.head.appendChild(style);

    setEl(div);

    return () => {
      div.remove();
      style.remove();
    };
  }, []);

  if (!el) return null;

  const coins = Array.from({ length: 15 }, (_, i) => ({
    left: (i * 7 + 2) % 100,
    delay: (i * 1.2) % 8,
    duration: 7 + (i % 5) * 2,
    size: 18 + (i % 4) * 5,
    opacity: 0.15 + (i % 3) * 0.08,
    reverse: i % 2 === 0,
  }));

  return createPortal(
    <>
      {coins.map((c, i) => (
        <div key={i} style={{
          position: "absolute",
          left: `${c.left}%`,
          top: -40,
          animation: `cf ${c.duration}s ${c.delay}s linear infinite`,
          opacity: c.opacity,
        }}>
          <div style={{ width: c.size, height: c.size, animation: `cs ${2 + (i % 3)}s linear infinite ${c.reverse ? "reverse" : "normal"}` }}>
            <CoinSVG size={c.size} />
          </div>
        </div>
      ))}
    </>,
    el,
  );
}

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="w-full">
      <CoinRainPortal />
      {children}
    </div>
  );
}
