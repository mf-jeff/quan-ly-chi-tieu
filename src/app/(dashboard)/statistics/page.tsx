"use client";

import { useState } from "react";
import { PieChart as PieChartIcon, Filter, ChevronLeft, ChevronRight, TrendingUp, TrendingDown, Minus, ArrowRightLeft, Wallet } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area } from "recharts";
import { useTransactions, useCategories, usePayers, useMonthComparison } from "@/lib/hooks";
import { formatVND, formatShortVND } from "@/lib/utils";
import { useT } from "@/lib/i18n";
import { format } from "date-fns";
import { getIcon } from "@/lib/icon-map";

function ChartTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number; dataKey: string }>; label?: string }) {
  if (!active || !payload) return null;
  return (
    <div className="bg-card border border-border rounded-xl p-3 shadow-lg">
      <p className="text-sm font-medium text-card-foreground mb-1">{label}</p>
      {payload.map((e) => (
        <p key={e.dataKey} className="text-xs text-muted">{e.dataKey === "income" ? "Income" : "Expense"}: {formatShortVND(e.value)}</p>
      ))}
    </div>
  );
}

export default function StatisticsPage() {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());

  const startDate = new Date(year, month - 1, 1).toISOString();
  const endDate = new Date(year, month, 0, 23, 59, 59).toISOString();
  const { data } = useTransactions({ startDate, endDate, limit: "9999" });
  const { data: catData } = useCategories();
  const { data: payerData } = usePayers();
  const t = useT();
  const [filterCat, setFilterCat] = useState("all");
  const [filterPayer, setFilterPayer] = useState("all");

  // Compare month (default: previous month)
  const defaultCmpMonth = month === 1 ? 12 : month - 1;
  const defaultCmpYear = month === 1 ? year - 1 : year;
  const [cmpMonth, setCmpMonth] = useState(defaultCmpMonth);
  const [cmpYear, setCmpYear] = useState(defaultCmpYear);

  // Update compare month when main month changes
  const [lastMonth, setLastMonth] = useState(month);
  const [lastYear, setLastYear] = useState(year);
  if (month !== lastMonth || year !== lastYear) {
    setLastMonth(month); setLastYear(year);
    setCmpMonth(month === 1 ? 12 : month - 1);
    setCmpYear(month === 1 ? year - 1 : year);
  }

  function prevMonth() { if (month === 1) { setMonth(12); setYear(year - 1); } else setMonth(month - 1); }
  function nextMonth() { if (month === 12) { setMonth(1); setYear(year + 1); } else setMonth(month + 1); }
  const monthNames = ["", "Tháng 1", "Tháng 2", "Tháng 3", "Tháng 4", "Tháng 5", "Tháng 6", "Tháng 7", "Tháng 8", "Tháng 9", "Tháng 10", "Tháng 11", "Tháng 12"];

  const { data: compareData } = useMonthComparison(month, year, cmpMonth, cmpYear);

  const allTxs = data?.transactions || [];
  const categories = catData?.categories || [];
  const allPayers = payerData?.payers || [];

  // Month totals (unfiltered)
  const monthIncome = allTxs.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0);
  const monthExpense = allTxs.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0);
  const monthBalance = monthIncome - monthExpense;

  // Apply filters
  const txs = allTxs.filter((tx) => {
    if (filterCat !== "all" && tx.categoryId !== filterCat) return false;
    if (filterPayer !== "all" && tx.payer !== filterPayer) return false;
    return true;
  });

  const expByCat: Record<string, { name: string; color: string; icon: string; amount: number }> = {};
  txs.filter((t) => t.type === "expense").forEach((t) => {
    if (!expByCat[t.categoryId]) expByCat[t.categoryId] = { name: t.category.name, color: t.category.color, icon: t.category.icon, amount: 0 };
    expByCat[t.categoryId].amount += t.amount;
  });
  const totalExpense = Object.values(expByCat).reduce((s, v) => s + v.amount, 0);
  const catSummary = Object.entries(expByCat)
    .map(([id, d]) => ({ id, ...d, pct: totalExpense > 0 ? Math.round((d.amount / totalExpense) * 1000) / 10 : 0 }))
    .sort((a, b) => b.amount - a.amount);
  const topCat = catSummary[0];

  const dailyMap: Record<string, { income: number; expense: number }> = {};
  txs.forEach((tx) => { const key = format(new Date(tx.date), "dd/MM"); if (!dailyMap[key]) dailyMap[key] = { income: 0, expense: 0 }; dailyMap[key][tx.type as "income" | "expense"] += tx.amount; });
  const dailyData = Object.entries(dailyMap).map(([date, d]) => ({ date, ...d })).sort((a, b) => { const [da, ma] = a.date.split("/").map(Number); const [db, mb] = b.date.split("/").map(Number); return ma !== mb ? ma - mb : da - db; });

  const weekMap: Record<string, { income: number; expense: number }> = {};
  txs.forEach((tx) => { const w = `W${Math.ceil(new Date(tx.date).getDate() / 7)}`; if (!weekMap[w]) weekMap[w] = { income: 0, expense: 0 }; weekMap[w][tx.type as "income" | "expense"] += tx.amount; });
  const weeklyData = Object.entries(weekMap).map(([week, d]) => ({ week, ...d })).sort((a, b) => a.week.localeCompare(b.week));

  const topExpenses = [...txs].filter((t) => t.type === "expense").sort((a, b) => b.amount - a.amount).slice(0, 5);
  const avgDaily = dailyData.length > 0 ? totalExpense / dailyData.length : 0;

  return (
    <div className="p-4 lg:p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <div className="bg-primary-light/10 text-primary-light p-3 rounded-xl"><PieChartIcon className="w-6 h-6" /></div>
        <div><h1 className="text-2xl font-bold text-foreground">{t("stats.title")}</h1><p className="text-muted text-sm">{t("stats.subtitle")}</p></div>
      </div>

      {/* Month selector */}
      <div className="flex items-center justify-center gap-4">
        <button onClick={prevMonth} className="p-2 rounded-xl hover:bg-muted-bg text-muted hover:text-foreground transition-colors">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div className="text-center min-w-[140px]">
          <p className="text-lg font-bold text-foreground">{monthNames[month]}</p>
          <p className="text-xs text-muted">{year}</p>
        </div>
        <button onClick={nextMonth} className="p-2 rounded-xl hover:bg-muted-bg text-muted hover:text-foreground transition-colors">
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
        <div className="bg-card rounded-2xl border border-border p-4 border-t-[3px] border-t-primary-light">
          <div className="flex items-center justify-between mb-2">
            <span className="text-muted text-xs">Số dư</span>
            <Wallet className="w-4 h-4 text-primary-light" />
          </div>
          <p className={`text-lg font-bold ${monthBalance >= 0 ? "text-card-foreground" : "text-danger"}`}>{formatVND(monthBalance)}</p>
        </div>
        <div className="bg-card rounded-2xl border border-border p-4 border-t-[3px] border-t-accent">
          <div className="flex items-center justify-between mb-2">
            <span className="text-muted text-xs">Thu nhập</span>
            <TrendingUp className="w-4 h-4 text-accent" />
          </div>
          <p className="text-lg font-bold text-accent">{formatVND(monthIncome)}</p>
        </div>
        <div className="bg-card rounded-2xl border border-border p-4 border-t-[3px] border-t-danger">
          <div className="flex items-center justify-between mb-2">
            <span className="text-muted text-xs">Chi tiêu</span>
            <TrendingDown className="w-4 h-4 text-danger" />
          </div>
          <p className="text-lg font-bold text-danger">{formatVND(monthExpense)}</p>
        </div>
        <div className="bg-card rounded-2xl border border-border p-4 border-t-[3px] border-t-warning">
          <div className="flex items-center justify-between mb-2">
            <span className="text-muted text-xs">Giao dịch</span>
            <ArrowRightLeft className="w-4 h-4 text-warning" />
          </div>
          <p className="text-lg font-bold text-card-foreground">{allTxs.length}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-card rounded-2xl border border-border p-4">
        <div className="flex items-center gap-3 flex-wrap">
          <Filter className="w-4 h-4 text-muted shrink-0" />
          <select value={filterCat} onChange={(e) => setFilterCat(e.target.value)}
            className="bg-muted-bg border border-border rounded-xl px-3 py-2 text-sm text-foreground focus:outline-none">
            <option value="all">{t("tx.allCategories")}</option>
            {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <select value={filterPayer} onChange={(e) => setFilterPayer(e.target.value)}
            className="bg-muted-bg border border-border rounded-xl px-3 py-2 text-sm text-foreground focus:outline-none">
            <option value="all">Tất cả người</option>
            {allPayers.map((p) => <option key={p.id} value={p.name}>{p.name}</option>)}
          </select>
          {(filterCat !== "all" || filterPayer !== "all") && (
            <button onClick={() => { setFilterCat("all"); setFilterPayer("all"); }}
              className="text-xs text-primary-light hover:underline">Xóa bộ lọc</button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-card rounded-2xl border border-border p-5">
          <p className="text-muted text-sm">{t("stats.avgDaily")}</p>
          <p className="text-2xl font-bold text-foreground mt-1">{formatVND(Math.round(avgDaily))}</p>
        </div>
        <div className="bg-card rounded-2xl border border-border p-5">
          <p className="text-muted text-sm">{t("stats.topCategory")}</p>
          <div className="flex items-center gap-2 mt-1">
            {topCat ? (<><div className="w-3 h-3 rounded-full" style={{ backgroundColor: topCat.color }} /><p className="text-2xl font-bold text-foreground">{topCat.name}</p></>) : <p className="text-muted">--</p>}
          </div>
        </div>
        <div className="bg-card rounded-2xl border border-border p-5">
          <p className="text-muted text-sm">{t("stats.catCount")}</p>
          <p className="text-2xl font-bold text-foreground mt-1">{catSummary.length}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-card rounded-2xl border border-border p-5">
          <h3 className="text-lg font-semibold text-card-foreground mb-4">{t("stats.ratio")}</h3>
          <div className="h-64"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={catSummary} cx="50%" cy="50%" outerRadius={100} dataKey="amount" labelLine={false}>{catSummary.map((e) => <Cell key={e.id} fill={e.color} />)}</Pie><Tooltip formatter={(v) => formatVND(Number(v))} /></PieChart></ResponsiveContainer></div>
        </div>
        <div className="bg-card rounded-2xl border border-border p-5">
          <h3 className="text-lg font-semibold text-card-foreground mb-4">{t("stats.weekly")}</h3>
          <div className="h-64"><ResponsiveContainer width="100%" height="100%"><BarChart data={weeklyData}><CartesianGrid strokeDasharray="3 3" stroke="var(--border)" /><XAxis dataKey="week" tick={{ fill: "var(--muted)", fontSize: 12 }} axisLine={false} tickLine={false} /><YAxis tickFormatter={formatShortVND} tick={{ fill: "var(--muted)", fontSize: 12 }} axisLine={false} tickLine={false} width={50} /><Tooltip content={<ChartTooltip />} /><Bar dataKey="expense" fill="#ef4444" radius={[6, 6, 0, 0]} barSize={40} /><Bar dataKey="income" fill="#10b981" radius={[6, 6, 0, 0]} barSize={40} /></BarChart></ResponsiveContainer></div>
        </div>
      </div>

      <div className="bg-card rounded-2xl border border-border p-5">
        <h3 className="text-lg font-semibold text-card-foreground mb-4">{t("stats.daily")}</h3>
        <div className="h-64"><ResponsiveContainer width="100%" height="100%"><AreaChart data={dailyData}><defs><linearGradient id="statExpGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#ef4444" stopOpacity={0.3} /><stop offset="100%" stopColor="#ef4444" stopOpacity={0} /></linearGradient></defs><CartesianGrid strokeDasharray="3 3" stroke="var(--border)" /><XAxis dataKey="date" tick={{ fill: "var(--muted)", fontSize: 12 }} axisLine={false} tickLine={false} /><YAxis tickFormatter={formatShortVND} tick={{ fill: "var(--muted)", fontSize: 12 }} axisLine={false} tickLine={false} width={50} /><Tooltip formatter={(v) => formatVND(Number(v))} /><Area type="monotone" dataKey="expense" stroke="#ef4444" strokeWidth={2} fill="url(#statExpGrad)" /></AreaChart></ResponsiveContainer></div>
      </div>

      <div className="bg-card rounded-2xl border border-border p-5">
        <h3 className="text-lg font-semibold text-card-foreground mb-4">{t("stats.top5")}</h3>
        <div className="space-y-3">
          {topExpenses.map((tx, i) => {
            const pct = totalExpense > 0 ? (tx.amount / totalExpense) * 100 : 0;
            const Icon = getIcon(tx.category.icon);
            return (
              <div key={tx.id} className="flex items-center gap-4">
                <span className="text-sm font-bold text-muted w-6">#{i + 1}</span>
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${tx.category.color}15` }}><Icon className="w-4 h-4" style={{ color: tx.category.color }} /></div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1"><p className="text-sm font-medium text-card-foreground truncate">{tx.note || tx.category.name}</p><span className="text-sm font-semibold text-danger shrink-0 ml-2">{formatVND(tx.amount)}</span></div>
                  <div className="h-1.5 bg-muted-bg rounded-full overflow-hidden"><div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: tx.category.color }} /></div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="bg-card rounded-2xl border border-border p-5">
        <h3 className="text-lg font-semibold text-card-foreground mb-4">{t("stats.catDetail")}</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-border"><th className="text-left py-3 px-2 text-muted font-medium">{t("tx.category")}</th><th className="text-right py-3 px-2 text-muted font-medium">{t("addTx.amount")}</th><th className="text-right py-3 px-2 text-muted font-medium">%</th><th className="text-left py-3 px-2 text-muted font-medium w-1/3"></th></tr></thead>
            <tbody>{catSummary.map((item) => (
              <tr key={item.id} className="border-b border-border last:border-0">
                <td className="py-3 px-2"><div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: item.color }} /><span className="text-card-foreground">{item.name}</span></div></td>
                <td className="text-right py-3 px-2 font-medium text-card-foreground">{formatVND(item.amount)}</td>
                <td className="text-right py-3 px-2 text-muted">{item.pct}%</td>
                <td className="py-3 px-2"><div className="h-2 bg-muted-bg rounded-full overflow-hidden"><div className="h-full rounded-full" style={{ width: `${item.pct}%`, backgroundColor: item.color }} /></div></td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      </div>

      {/* Month comparison */}
      {compareData && (
        <div className="bg-card rounded-2xl border border-border p-5">
          <div className="flex items-center justify-between gap-2 mb-4 flex-wrap">
            <div className="flex items-center gap-2">
              <ArrowRightLeft className="w-5 h-5 text-primary-light" />
              <h3 className="text-lg font-semibold text-card-foreground">
                So sánh T{month} với T{compareData.prevMonth}/{compareData.prevYear}
              </h3>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted">So với:</span>
              <select value={`${cmpYear}-${cmpMonth}`} onChange={(e) => { const [y, m] = e.target.value.split("-").map(Number); setCmpMonth(m); setCmpYear(y); }}
                className="bg-muted-bg border border-border rounded-xl px-3 py-1.5 text-sm text-foreground focus:outline-none">
                {Array.from({ length: 12 }, (_, i) => {
                  const m = ((month - 2 - i + 12) % 12) + 1;
                  const y = year - Math.floor((month - 1 - (m <= month ? 0 : 1) + (i >= month ? 1 : 0)) / 12 + (m > month || (m === month && i > 0) ? 1 : 0));
                  // Simpler: just generate last 12 months
                  const d = new Date(year, month - 2 - i, 1);
                  const mo = d.getMonth() + 1;
                  const yr = d.getFullYear();
                  if (mo === month && yr === year) return null;
                  return <option key={`${yr}-${mo}`} value={`${yr}-${mo}`}>T{mo}/{yr}</option>;
                })}
              </select>
            </div>
          </div>

          {/* Total comparison */}
          <div className="flex items-center justify-between p-4 rounded-xl bg-muted-bg/50 mb-4">
            <div>
              <p className="text-xs text-muted">T{compareData.prevMonth}</p>
              <p className="text-lg font-bold text-card-foreground">{formatVND(compareData.totalPrevious)}</p>
            </div>
            <div className="flex flex-col items-center">
              <div className={`flex items-center gap-1 px-3 py-1 rounded-full text-sm font-bold ${
                compareData.totalDiff > 0 ? "bg-danger/10 text-danger" : compareData.totalDiff < 0 ? "bg-accent/10 text-accent" : "bg-muted-bg text-muted"
              }`}>
                {compareData.totalDiff > 0 ? <TrendingUp className="w-4 h-4" /> : compareData.totalDiff < 0 ? <TrendingDown className="w-4 h-4" /> : <Minus className="w-4 h-4" />}
                {compareData.totalDiff > 0 ? "+" : ""}{compareData.totalPct}%
              </div>
              <p className="text-[10px] text-muted mt-0.5">
                {compareData.totalDiff > 0 ? `+${formatVND(compareData.totalDiff)}` : compareData.totalDiff < 0 ? formatVND(compareData.totalDiff) : "Không đổi"}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-muted">T{month}</p>
              <p className="text-lg font-bold text-card-foreground">{formatVND(compareData.totalCurrent)}</p>
            </div>
          </div>

          {/* Per-category comparison */}
          <div className="space-y-2">
            {compareData.categories.map((cat) => {
              const CatIcon = getIcon(cat.icon);
              const isMore = cat.diff > 0;
              const isLess = cat.diff < 0;
              return (
                <div key={cat.categoryId} className="flex items-center gap-3 py-2.5 px-3 rounded-xl hover:bg-muted-bg/30 transition-colors">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: `${cat.color}15` }}>
                    <CatIcon className="w-4 h-4" style={{ color: cat.color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-card-foreground truncate">{cat.name}</p>
                    <div className="flex items-center gap-2 text-[11px] text-muted mt-0.5">
                      <span>T{compareData.prevMonth}: {formatVND(cat.previous)}</span>
                      <span>→</span>
                      <span>T{month}: {formatVND(cat.current)}</span>
                    </div>
                  </div>
                  <div className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold shrink-0 ${
                    isMore ? "bg-danger/10 text-danger" : isLess ? "bg-accent/10 text-accent" : "bg-muted-bg text-muted"
                  }`}>
                    {isMore ? <TrendingUp className="w-3 h-3" /> : isLess ? <TrendingDown className="w-3 h-3" /> : <Minus className="w-3 h-3" />}
                    {isMore ? "+" : ""}{formatVND(cat.diff)}
                    {cat.pct !== 0 && <span className="ml-0.5">({isMore ? "+" : ""}{cat.pct}%)</span>}
                  </div>
                </div>
              );
            })}
            {compareData.categories.length === 0 && (
              <p className="text-sm text-muted text-center py-4">Chưa có dữ liệu để so sánh</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
