"use client";

import { useState } from "react";
import { Target, AlertTriangle, CheckCircle2, Plus, Pencil, Wallet } from "lucide-react";
import { useBudgets, useUserSettings, useUpdateUserSettings } from "@/lib/hooks";
import { getIcon } from "@/lib/icon-map";
import { formatVND } from "@/lib/utils";
import { useT } from "@/lib/i18n";
import BudgetModal from "@/components/dashboard/BudgetModal";

export default function BudgetPage() {
  const { data } = useBudgets();
  const t = useT();
  const budgets = data?.budgets || [];
  const [showModal, setShowModal] = useState(false);
  const [editData, setEditData] = useState<{ categoryId: string; categoryName: string; amount: number } | null>(null);

  const { data: settingsData } = useUserSettings();
  const updateSettings = useUpdateUserSettings();
  const totalBudget = settingsData?.settings?.totalBudget || 0;
  const [editingTotal, setEditingTotal] = useState(false);
  const [totalInput, setTotalInput] = useState("");

  function saveTotalBudget() {
    const val = Number(totalInput) || 0;
    updateSettings.mutate({ totalBudget: val }, { onSuccess: () => setEditingTotal(false) });
  }

  const totalSpent = budgets.reduce((s, b) => s + b.spent, 0);
  const catBudgetTotal = budgets.reduce((s, b) => s + b.amount, 0);
  const totalPct = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;
  const remaining = totalBudget - totalSpent;
  const overBudget = budgets.filter((b) => b.amount > 0 && b.spent > b.amount);
  const underBudget = budgets.filter((b) => b.amount > 0 && b.spent <= b.amount);

  function openAdd() { setEditData(null); setShowModal(true); }
  function openEdit(categoryId: string, categoryName: string, amount: number) { setEditData({ categoryId, categoryName, amount }); setShowModal(true); }

  return (
    <div className="p-4 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="bg-primary-light/10 text-primary-light p-3 rounded-xl"><Target className="w-6 h-6" /></div>
          <div><h1 className="text-2xl font-bold text-foreground">{t("budget.page.title")}</h1><p className="text-muted text-sm">{t("budget.page.subtitle")}</p></div>
        </div>
        <button onClick={openAdd} className="flex items-center gap-2 bg-primary text-white px-5 py-2.5 rounded-xl hover:bg-primary-light transition-colors text-sm font-medium w-fit">
          <Plus className="w-4 h-4" />{t("budget.add")}
        </button>
      </div>

      {/* Total budget card */}
      <div className={`bg-card rounded-2xl border p-6 ${totalBudget > 0 && totalSpent > totalBudget ? "border-danger/30" : "border-border"}`}>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-primary-light/10 flex items-center justify-center">
              <Wallet className="w-6 h-6 text-primary-light" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-card-foreground">{t("budget.total")}</h3>
              {totalBudget > 0 ? (
                <p className="text-muted text-sm mt-0.5">
                  {t("budget.spent")} {formatVND(totalSpent)} / {formatVND(totalBudget)}
                  {remaining > 0 && <span className="text-accent ml-2">({t("budget.remaining")} {formatVND(remaining)})</span>}
                  {remaining < 0 && <span className="text-danger ml-2">({t("budget.over")} {formatVND(Math.abs(remaining))})</span>}
                </p>
              ) : (
                <p className="text-muted text-sm mt-0.5">{t("budget.spent")} {formatVND(totalSpent)}</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-3">
            {totalBudget > 0 && !editingTotal && (
              <div className="text-right">
                <span className="text-3xl font-bold text-foreground">{Math.round(totalPct)}%</span>
                <p className="text-muted text-xs">{t("budget.used")}</p>
              </div>
            )}
            {editingTotal ? (
              <div className="flex items-center gap-2">
                <input type="number" value={totalInput} onChange={(e) => setTotalInput(e.target.value)} placeholder="Hạn mức tổng"
                  className="px-3 py-2 bg-muted-bg border border-border rounded-xl text-sm font-semibold text-foreground w-40 focus:outline-none focus:ring-2 focus:ring-primary-light/30" autoFocus />
                <button onClick={saveTotalBudget} className="px-3 py-2 bg-primary text-white text-sm rounded-xl hover:bg-primary-light transition-colors">Lưu</button>
                <button onClick={() => setEditingTotal(false)} className="px-3 py-2 bg-muted-bg text-muted text-sm rounded-xl">Hủy</button>
              </div>
            ) : (
              <button onClick={() => { setTotalInput(totalBudget.toString()); setEditingTotal(true); }}
                className="p-2 text-muted hover:text-primary-light hover:bg-primary-light/10 rounded-lg transition-colors">
                <Pencil className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {totalBudget > 0 && (
          <>
            <div role="progressbar" aria-valuenow={Math.round(totalPct)} aria-valuemin={0} aria-valuemax={100}
              className="h-4 bg-muted-bg rounded-full overflow-hidden">
              <div className="h-full rounded-full transition-all duration-700" style={{
                width: `${Math.min(totalPct, 100)}%`,
                background: totalPct > 100 ? "var(--danger)" : totalPct > 75 ? "var(--warning)" : "linear-gradient(to right, var(--accent), var(--primary-light))",
              }} />
            </div>
            <div className="flex items-center justify-between mt-2 text-xs text-muted">
              <span>0</span>
              <span>{formatVND(totalBudget)}</span>
            </div>
          </>
        )}

        {!totalBudget && !editingTotal && (
          <button onClick={() => { setTotalInput(""); setEditingTotal(true); }}
            className="w-full mt-2 py-2 border border-dashed border-border rounded-xl text-sm text-muted hover:text-primary-light hover:border-primary-light transition-colors">
            + Đặt hạn mức ngân sách tổng
          </button>
        )}
      </div>

      {/* Status summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-card rounded-2xl border border-border p-5 flex items-center gap-4">
          <div className="bg-accent/10 p-3 rounded-xl"><CheckCircle2 className="w-6 h-6 text-accent" /></div>
          <div><p className="text-2xl font-bold text-foreground">{underBudget.length}</p><p className="text-muted text-sm">{t("budget.inBudget")}</p></div>
        </div>
        <div className="bg-card rounded-2xl border border-border p-5 flex items-center gap-4">
          <div className="bg-warning/10 p-3 rounded-xl"><AlertTriangle className="w-6 h-6 text-warning" /></div>
          <div><p className="text-2xl font-bold text-foreground">{overBudget.length}</p><p className="text-muted text-sm">{t("budget.overBudget")}</p></div>
        </div>
        <div className="bg-card rounded-2xl border border-border p-5 flex items-center gap-4">
          <div className="bg-primary-light/10 p-3 rounded-xl"><Target className="w-6 h-6 text-primary-light" /></div>
          <div><p className="text-2xl font-bold text-foreground">{formatVND(catBudgetTotal)}</p><p className="text-muted text-sm">Tổng hạn mức danh mục</p></div>
        </div>
      </div>

      {/* Budget cards per category */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {budgets.length === 0 && <div className="col-span-full bg-card rounded-2xl border border-border p-12 text-center"><p className="text-muted">{t("budget.empty")}</p></div>}
        {budgets.map((item) => {
          const pct = item.amount > 0 ? (item.spent / item.amount) * 100 : 0;
          const isOver = item.amount > 0 && item.spent > item.amount;
          const isWarning = pct >= 75 && !isOver;
          const noLimit = item.amount === 0;
          const color = item.category.color;
          const Icon = getIcon(item.category.icon);
          const itemRemaining = item.amount - item.spent;

          return (
            <div key={item.id} className={`bg-card rounded-2xl border p-5 ${isOver ? "border-danger/30" : isWarning ? "border-warning/30" : noLimit ? "border-warning/20" : "border-border"}`}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${color}15` }}>
                    <Icon className="w-5 h-5" style={{ color }} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-card-foreground">{item.category.name}</p>
                    <p className="text-xs text-muted">{noLimit ? t("budget.noLimit") : isOver ? t("budget.over") : `${t("budget.remaining")} ${formatVND(itemRemaining)}`}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  {isOver && <AlertTriangle className="w-5 h-5 text-danger" />}
                  {!isOver && !noLimit && pct < 50 && <CheckCircle2 className="w-5 h-5 text-accent" />}
                  <button onClick={() => openEdit(item.categoryId, item.category.name, item.amount)} className="p-1.5 text-muted hover:text-primary-light hover:bg-primary-light/10 rounded-lg transition-colors"><Pencil className="w-4 h-4" /></button>
                </div>
              </div>
              <div className="flex items-end justify-between mb-2">
                <span className="text-lg font-bold text-card-foreground">{formatVND(item.spent)}</span>
                {item.amount > 0 ? <span className="text-xs text-muted">/ {formatVND(item.amount)}</span> : <button onClick={() => openEdit(item.categoryId, item.category.name, 0)} className="text-xs text-warning hover:text-primary-light transition-colors">{t("budget.setLimit")}</button>}
              </div>
              {item.amount > 0 && (<><div role="progressbar" aria-valuenow={Math.round(Math.min(pct, 100))} aria-valuemin={0} aria-valuemax={100} className="h-2.5 bg-muted-bg rounded-full overflow-hidden"><div className="h-full rounded-full transition-all duration-500" style={{ width: `${Math.min(pct, 100)}%`, backgroundColor: isOver ? "var(--danger)" : isWarning ? "var(--warning)" : color }} /></div><p className="text-right text-xs text-muted mt-1">{Math.round(pct)}%</p></>)}
            </div>
          );
        })}
      </div>
      <BudgetModal open={showModal} onClose={() => setShowModal(false)} editData={editData} />
    </div>
  );
}
