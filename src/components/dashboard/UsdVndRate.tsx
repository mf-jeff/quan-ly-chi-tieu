"use client";

import { useState, useEffect, useCallback } from "react";
import { USD_VND_FALLBACK } from "@/lib/constants";
import { DollarSign, TrendingUp, TrendingDown, RefreshCw } from "lucide-react";

export default function UsdVndRate() {
  const [rate, setRate] = useState<number | null>(null);
  const [change, setChange] = useState(0);
  const [spinning, setSpinning] = useState(false);

  const fetchRate = useCallback(async () => {
    setSpinning(true);
    try {
      const res = await fetch("/api/market", { cache: "no-store" });
      if (!res.ok) throw new Error();
      const json = await res.json();
      const usd = json.usdVnd;
      if (usd) {
        const prev = Number(localStorage.getItem("prev-usd-vnd")) || usd;
        setChange(usd - prev);
        localStorage.setItem("prev-usd-vnd", usd.toString());
        setRate(usd);
      }
    } catch {
      if (!rate) setRate(USD_VND_FALLBACK);
    } finally {
      setTimeout(() => setSpinning(false), 500);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    fetchRate();
    const id = setInterval(fetchRate, 60_000);
    return () => clearInterval(id);
  }, [fetchRate]);

  const isUp = change > 0;
  const isDown = change < 0;

  return (
    <div className="flex items-center gap-2 text-sm bg-card border border-border rounded-xl px-3 py-2">
      <DollarSign className="w-4 h-4 text-accent shrink-0" />
      <div className="flex items-center gap-1.5">
        <span className="font-semibold text-card-foreground">
          {rate ? new Intl.NumberFormat("vi-VN").format(Math.round(rate)) : "--"}
        </span>
        <span className="text-xs text-muted">₫</span>
        {isUp && <TrendingUp className="w-3 h-3 text-accent" />}
        {isDown && <TrendingDown className="w-3 h-3 text-danger" />}
      </div>
      <button
        onClick={() => fetchRate()}
        className="p-0.5 text-muted hover:text-primary-light cursor-pointer"
      >
        <RefreshCw className={`w-3 h-3 ${spinning ? "animate-spin" : ""}`} />
      </button>
    </div>
  );
}
