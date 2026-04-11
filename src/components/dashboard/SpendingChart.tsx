"use client";

import { useState } from "react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { transactionApi } from "@/lib/api";
import { formatShortVND, formatVND } from "@/lib/utils";
import { useT } from "@/lib/i18n";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number; dataKey: string }>; label?: string }) {
  if (!active || !payload) return null;
  return (
    <div className="bg-card border border-border rounded-xl p-3 shadow-xl backdrop-blur-sm">
      <p className="text-xs font-semibold text-card-foreground mb-2 pb-1.5 border-b border-border">{label}</p>
      {payload.map((entry) => (
        <div key={entry.dataKey} className="flex items-center justify-between gap-4 py-0.5">
          <div className="flex items-center gap-1.5">
            <div className={`w-2 h-2 rounded-full ${entry.dataKey === "income" ? "bg-accent" : "bg-danger"}`} />
            <span className="text-xs text-muted">{entry.dataKey === "income" ? "Thu nhập" : "Chi tiêu"}</span>
          </div>
          <span className={`text-xs font-semibold ${entry.dataKey === "income" ? "text-accent" : "text-danger"}`}>
            {formatVND(entry.value)}
          </span>
        </div>
      ))}
    </div>
  );
}

type ChartRange = "month" | "custom";

export default function SpendingChart() {
  const t = useT();
  const now = new Date();
  const [range, setRange] = useState<ChartRange>("month");
  const [selectedMonth, setSelectedMonth] = useState(now.toISOString().slice(0, 7));
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // Build date params based on range
  const dateParams: Record<string, string> = {};
  if (range === "month") {
    const [y, m] = selectedMonth.split("-").map(Number);
    dateParams.startDate = new Date(y, m - 1, 1).toISOString();
    dateParams.endDate = new Date(y, m, 0, 23, 59, 59).toISOString();
  } else if (startDate && endDate) {
    dateParams.startDate = new Date(startDate).toISOString();
    dateParams.endDate = new Date(endDate + "T23:59:59").toISOString();
  }

  const { data } = useQuery({
    queryKey: ["chart-transactions", dateParams],
    queryFn: () => transactionApi.list(dateParams),
  });

  const txs = data?.transactions || [];

  // Calculate totals
  const totalIncome = txs.filter((tx) => tx.type === "income").reduce((s, tx) => s + tx.amount, 0);
  const totalExpense = txs.filter((tx) => tx.type === "expense").reduce((s, tx) => s + tx.amount, 0);

  const dailyMap: Record<string, { income: number; expense: number }> = {};
  txs.forEach((tx) => {
    const key = format(new Date(tx.date), "dd/MM");
    if (!dailyMap[key]) dailyMap[key] = { income: 0, expense: 0 };
    dailyMap[key][tx.type as "income" | "expense"] += tx.amount;
  });

  const chartData = Object.entries(dailyMap)
    .map(([date, d]) => ({ date, ...d }))
    .sort((a, b) => {
      const [da, ma] = a.date.split("/").map(Number);
      const [db, mb] = b.date.split("/").map(Number);
      return ma !== mb ? ma - mb : da - db;
    });

  return (
    <div className="bg-card rounded-2xl p-5 border border-border">
      {/* Header with filters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <h3 className="text-lg font-semibold text-card-foreground">{t("chart.title")}</h3>
        <div className="flex items-center gap-2 flex-wrap">
          {/* Range toggle */}
          <div className="flex gap-1 bg-muted-bg rounded-lg p-0.5">
            <button onClick={() => setRange("month")}
              className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${range === "month" ? "bg-card text-card-foreground shadow-sm" : "text-muted"}`}>
              Tháng
            </button>
            <button onClick={() => { setRange("custom"); if (!startDate) { setStartDate(now.toISOString().slice(0, 10)); setEndDate(now.toISOString().slice(0, 10)); } }}
              className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${range === "custom" ? "bg-card text-card-foreground shadow-sm" : "text-muted"}`}>
              Tùy chọn
            </button>
          </div>

          {/* Date inputs */}
          {range === "month" && (
            <input type="month" value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)}
              className="px-2.5 py-1 bg-muted-bg border border-border rounded-lg text-xs text-foreground focus:outline-none" />
          )}
          {range === "custom" && (
            <div className="flex items-center gap-1">
              <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)}
                className="px-2 py-1 bg-muted-bg border border-border rounded-lg text-xs text-foreground focus:outline-none" />
              <span className="text-xs text-muted">→</span>
              <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)}
                className="px-2 py-1 bg-muted-bg border border-border rounded-lg text-xs text-foreground focus:outline-none" />
            </div>
          )}
        </div>
      </div>

      {/* Summary */}
      <div className="flex items-center gap-4 mb-4 text-xs">
        <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full bg-accent" /><span className="text-muted">{t("chart.income")}: <span className="font-semibold text-accent">{formatVND(totalIncome)}</span></span></div>
        <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full bg-danger" /><span className="text-muted">{t("chart.expense")}: <span className="font-semibold text-danger">{formatVND(totalExpense)}</span></span></div>
      </div>

      {/* Chart */}
      <div className="h-72">
        {chartData.length === 0 ? (
          <div className="h-full flex items-center justify-center text-muted text-sm">Không có dữ liệu</div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="incomeGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10b981" stopOpacity={0.4} />
                  <stop offset="50%" stopColor="#10b981" stopOpacity={0.1} />
                  <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="expenseGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#ef4444" stopOpacity={0.4} />
                  <stop offset="50%" stopColor="#ef4444" stopOpacity={0.1} />
                  <stop offset="100%" stopColor="#ef4444" stopOpacity={0} />
                </linearGradient>
                <filter id="glow">
                  <feGaussianBlur stdDeviation="2" result="coloredBlur" />
                  <feMerge><feMergeNode in="coloredBlur" /><feMergeNode in="SourceGraphic" /></feMerge>
                </filter>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis dataKey="date" tick={{ fill: "var(--muted)", fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis tickFormatter={formatShortVND} tick={{ fill: "var(--muted)", fontSize: 12 }} axisLine={false} tickLine={false} width={50} />
              <Tooltip content={<CustomTooltip />} cursor={{ stroke: "var(--muted)", strokeDasharray: "4 4", strokeWidth: 1 }} />
              <Area
                type="monotone"
                dataKey="income"
                stroke="#10b981"
                strokeWidth={2.5}
                fill="url(#incomeGrad)"
                dot={{ r: 3, fill: "#10b981", strokeWidth: 2, stroke: "white" }}
                activeDot={{ r: 6, fill: "#10b981", strokeWidth: 2, stroke: "white", filter: "url(#glow)" }}
              />
              <Area
                type="monotone"
                dataKey="expense"
                stroke="#ef4444"
                strokeWidth={2.5}
                fill="url(#expenseGrad)"
                dot={{ r: 3, fill: "#ef4444", strokeWidth: 2, stroke: "white" }}
                activeDot={{ r: 6, fill: "#ef4444", strokeWidth: 2, stroke: "white", filter: "url(#glow)" }}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
