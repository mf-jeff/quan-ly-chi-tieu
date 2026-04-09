"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { useTransactions } from "@/lib/hooks";
import { formatVND } from "@/lib/utils";

function CustomTooltip({ active, payload }: { active?: boolean; payload?: Array<{ payload: { name: string; amount: number; pct: number } }> }) {
  if (!active || !payload?.[0]) return null;
  const d = payload[0].payload;
  return (
    <div className="bg-card border border-border rounded-xl p-3 shadow-lg">
      <p className="text-sm font-medium text-card-foreground">{d.name}</p>
      <p className="text-xs text-muted">{formatVND(d.amount)} ({d.pct}%)</p>
    </div>
  );
}

export default function CategoryBreakdown() {
  const { data } = useTransactions();
  const txs = data?.transactions || [];

  const byCategory: Record<string, { name: string; color: string; amount: number }> = {};
  txs.filter((t) => t.type === "expense").forEach((t) => {
    if (!byCategory[t.categoryId]) {
      byCategory[t.categoryId] = { name: t.category.name, color: t.category.color, amount: 0 };
    }
    byCategory[t.categoryId].amount += t.amount;
  });

  const total = Object.values(byCategory).reduce((s, v) => s + v.amount, 0);
  const chartData = Object.entries(byCategory)
    .map(([id, d]) => ({ id, ...d, pct: total > 0 ? Math.round((d.amount / total) * 1000) / 10 : 0 }))
    .sort((a, b) => b.amount - a.amount);

  return (
    <div className="bg-card rounded-2xl p-5 border border-border">
      <h3 className="text-lg font-semibold text-card-foreground mb-4">Chi tiêu theo danh mục</h3>
      <div className="flex flex-col items-center">
        <div className="h-52 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={chartData} cx="50%" cy="50%" innerRadius={55} outerRadius={90} paddingAngle={3} dataKey="amount">
                {chartData.map((e) => <Cell key={e.id} fill={e.color} />)}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="grid grid-cols-2 gap-x-6 gap-y-2 mt-2 w-full">
          {chartData.map((item) => (
            <div key={item.id} className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
              <span className="text-xs text-muted truncate">{item.name}</span>
              <span className="text-xs font-medium text-card-foreground ml-auto">{item.pct}%</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
