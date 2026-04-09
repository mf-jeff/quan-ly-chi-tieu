"use client";

import dynamic from "next/dynamic";

const CoinRain = dynamic(() => import("@/components/CoinRain"), { ssr: false });

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="w-full relative min-h-screen">
      <CoinRain />
      <div className="relative z-10">{children}</div>
    </div>
  );
}
