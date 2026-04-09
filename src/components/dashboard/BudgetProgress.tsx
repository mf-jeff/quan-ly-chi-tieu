"use client";

import { AlertTriangle } from "lucide-react";
import { useBudgets } from "@/lib/hooks";
import { getIcon } from "@/lib/icon-map";
import { formatVND } from "@/lib/utils";
import { useT } from "@/lib/i18n";
import { CardSkeleton } from "@/components/ui/Skeleton";

export default function BudgetProgress() {
  const { data, isLoading } = useBudgets();
  const t = useT();
  const budgets = data?.budgets || [];

  if (isLoading) return <CardSkeleton />;

  return (
    <div className="bg-card rounded-2xl p-5 border border-border">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-card-foreground">{t("budget.title")}</h3>
        <a href="/budget" className="text-primary-light text-sm hover:underline">{t("budget.detail")}</a>
      </div>
      <div className="space-y-4">
        {budgets.length === 0 && <p className="text-muted text-sm text-center py-4">{t("recent.empty")}</p>}
        {budgets.map((item) => {
          const pct = item.amount > 0 ? Math.round((item.spent / item.amount) * 100) : 0;
          const pctClamped = Math.min(pct, 100);
          const color = item.category.color;
          const isOver = item.amount > 0 && item.spent > item.amount;
          const isWarning = pct >= 75 && !isOver;
          const Icon = getIcon(item.category.icon);

          return (
            <div key={item.id} className="group">
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${color}15` }}>
                    <Icon className="w-3.5 h-3.5" style={{ color }} />
                  </div>
                  <span className="text-sm font-medium text-card-foreground">{item.category.name}</span>
                  {isOver && <AlertTriangle className="w-3.5 h-3.5 text-danger" />}
                </div>
                <div className="flex items-center gap-2">
                  {item.amount > 0 && (
                    <span className={`text-xs font-semibold px-1.5 py-0.5 rounded ${
                      isOver ? "bg-danger/10 text-danger" : isWarning ? "bg-warning/10 text-warning" : "bg-accent/10 text-accent"
                    }`}>
                      {pct}%
                    </span>
                  )}
                  <span className="text-xs text-muted">
                    {formatVND(item.spent)}
                    {item.amount > 0 && <span className="text-muted/50"> / {formatVND(item.amount)}</span>}
                    {item.amount === 0 && <span className="text-warning"> {t("budget.notSet")}</span>}
                  </span>
                </div>
              </div>
              {item.amount > 0 && (
                <div role="progressbar" aria-valuenow={pctClamped} aria-valuemin={0} aria-valuemax={100}
                  className="h-2.5 bg-muted-bg rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-700 ease-out"
                    style={{
                      width: `${pctClamped}%`,
                      background: isOver
                        ? "linear-gradient(90deg, #ef4444, #dc2626)"
                        : isWarning
                        ? `linear-gradient(90deg, ${color}, #f59e0b)`
                        : `linear-gradient(90deg, ${color}99, ${color})`,
                    }}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
