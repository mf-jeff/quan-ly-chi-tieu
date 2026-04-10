"use client";

import { useTransactions } from "@/lib/hooks";
import { getIcon } from "@/lib/icon-map";
import { formatVND, formatDateShort } from "@/lib/utils";
import { useT } from "@/lib/i18n";

export default function RecentTransactions() {
  const { data } = useTransactions();
  const t = useT();
  const recent = (data?.transactions || []).slice(0, 7);

  return (
    <div className="bg-card rounded-2xl p-5 border border-border">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-card-foreground">{t("recent.title")}</h3>
        <a href="/transactions" className="text-primary-light text-sm hover:underline">{t("recent.viewAll")}</a>
      </div>
      <div className="space-y-3">
        {recent.length === 0 && <p className="text-muted text-sm text-center py-4">{t("recent.empty")}</p>}
        {recent.map((tx) => {
          const Icon = getIcon(tx.category.icon);
          const color = tx.category.color;
          const isIncome = tx.type === "income";
          return (
            <div key={tx.id} className="flex items-center gap-3 py-2 border-b border-border last:border-0">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: `${color}15` }}>
                <Icon className="w-4 h-4" style={{ color }} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-card-foreground truncate">{tx.category.name}</p>
                {tx.note && <p className="text-xs text-muted truncate">{tx.note}</p>}
              </div>
              <span className="text-xs text-muted shrink-0">
                {formatDateShort(tx.date)}
              </span>
              <span className={`text-sm font-semibold whitespace-nowrap shrink-0 ${isIncome ? "text-accent" : "text-danger"}`}>
                {isIncome ? "+" : "-"}{formatVND(tx.amount)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
