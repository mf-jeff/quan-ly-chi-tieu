"use client";

import { useState, useEffect } from "react";
import { Clock, Plus } from "lucide-react";
import { useAuth } from "@/lib/auth-store";
import { VN_TIMEZONE } from "@/lib/utils";
import { useT } from "@/lib/i18n";
import SummaryCards from "@/components/dashboard/SummaryCards";
import DatePicker from "@/components/dashboard/DatePicker";
import SpendingChart from "@/components/dashboard/SpendingChart";
import CategoryBreakdown from "@/components/dashboard/CategoryBreakdown";
import RecentTransactions from "@/components/dashboard/RecentTransactions";
import BudgetProgress from "@/components/dashboard/BudgetProgress";
import UsdVndRate from "@/components/dashboard/UsdVndRate";
import AiInsights from "@/components/dashboard/AiInsights";
import AddTransactionModal from "@/components/dashboard/AddTransactionModal";

function VNClock() {
  const [time, setTime] = useState("");
  const [dateStr, setDateStr] = useState("");

  useEffect(() => {
    function tick() {
      const now = new Date();
      setTime(
        now.toLocaleTimeString("vi-VN", { timeZone: VN_TIMEZONE, hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false })
      );
      const vnNow = new Date(now.toLocaleString("en-US", { timeZone: VN_TIMEZONE }));
      const days = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];
      const dd = String(vnNow.getDate()).padStart(2, "0");
      const mm = String(vnNow.getMonth() + 1).padStart(2, "0");
      setDateStr(`${days[vnNow.getDay()]}, ${dd}/${mm}/${vnNow.getFullYear()}`);
    }
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <>
      <span className="font-mono font-semibold text-sm text-card-foreground">{time}</span>
      <span className="text-xs text-muted hidden sm:inline">{dateStr}</span>
    </>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const t = useT();
  const [showAddTx, setShowAddTx] = useState(false);

  return (
    <div className="p-4 lg:p-8 max-w-7xl mx-auto space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-foreground">
              {t("hello")} {user?.name || "bạn"}!
            </h1>
            <p className="text-muted text-sm mt-0.5">
              {t("dashboard.subtitle")}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setShowAddTx(true)}
              className="flex items-center gap-1.5 bg-primary text-white px-3 py-2.5 sm:px-4 sm:py-2 rounded-xl hover:bg-primary-light transition-colors text-sm font-medium">
              <Plus className="w-5 h-5 sm:w-4 sm:h-4" /><span className="hidden sm:inline">{t("tx.add")}</span>
            </button>
            <DatePicker />
          </div>
        </div>
        {/* Info bar */}
        <div className="flex items-center justify-between bg-card border border-border rounded-xl px-4 py-2">
          <div className="flex items-center gap-3">
            <Clock className="w-4 h-4 text-primary-light" />
            <VNClock />
          </div>
          <UsdVndRate />
        </div>
      </div>

      {/* Summary Cards */}
      <SummaryCards />

      {/* AI Insights */}
      <AiInsights />

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <SpendingChart />
        </div>
        <CategoryBreakdown />
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RecentTransactions />
        <BudgetProgress />
      </div>
      <AddTransactionModal open={showAddTx} onClose={() => setShowAddTx(false)} />
    </div>
  );
}
