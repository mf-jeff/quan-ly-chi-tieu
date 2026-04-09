"use client";

export default function CoinRain() {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0" aria-hidden="true">
      {Array.from({ length: 15 }).map((_, i) => {
        const left = (i * 7 + 3) % 100;
        const delay = (i * 1.3) % 8;
        const duration = 7 + (i % 5) * 2;
        const size = 18 + (i % 4) * 5;
        const opacity = 0.12 + (i % 3) * 0.06;

        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: `${left}%`,
              top: "-40px",
              animation: `coinFall ${duration}s ${delay}s linear infinite`,
              opacity,
            }}
          >
            <div
              style={{
                width: size,
                height: size,
                animation: `coinSpin ${2 + (i % 3)}s linear infinite ${i % 2 === 0 ? "reverse" : "normal"}`,
              }}
            >
              <svg width={size} height={size} viewBox="0 0 40 40">
                <circle cx="20" cy="20" r="18" fill="#f59e0b" stroke="#d97706" strokeWidth="2" />
                <circle cx="20" cy="20" r="14" fill="none" stroke="#fbbf24" strokeWidth="1" />
                <text x="20" y="26" textAnchor="middle" fontSize="16" fontWeight="bold" fill="#92400e" fontFamily="sans-serif">₫</text>
                <ellipse cx="13" cy="13" rx="4" ry="6" fill="#fde68a" opacity="0.4" transform="rotate(-30 13 13)" />
              </svg>
            </div>
          </div>
        );
      })}
    </div>
  );
}
