"use client";

import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { useCategories, useUpsertBudget } from "@/lib/hooks";
import { getIcon } from "@/lib/icon-map";
import { formatVND } from "@/lib/utils";
import { useT } from "@/lib/i18n";

interface Props {
  open: boolean;
  onClose: () => void;
  editData?: {
    categoryId: string;
    categoryName: string;
    amount: number;
  } | null;
}

export default function BudgetModal({ open, onClose, editData }: Props) {
  const { data: catData } = useCategories();
  const upsertBudget = useUpsertBudget();
  const t = useT();
  const categories = catData?.categories || [];
  const expenseCategories = categories.filter((c) => c.type === "expense" || c.type === "both");

  const [categoryId, setCategoryId] = useState("");
  const [amount, setAmount] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (editData) {
      setCategoryId(editData.categoryId);
      setAmount(editData.amount > 0 ? editData.amount.toString() : "");
    } else {
      setCategoryId("");
      setAmount("");
    }
    setError("");
  }, [editData, open]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!categoryId) { setError(t("addTx.error.category")); return; }
    const parsed = Number(amount) || 0;

    upsertBudget.mutate(
      { categoryId, amount: parsed },
      {
        onSuccess: () => onClose(),
        onError: (err) => setError(err.message),
      }
    );
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-card rounded-2xl border border-border shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between p-5 border-b border-border">
          <h2 className="text-lg font-semibold text-card-foreground">
            {editData ? t("budget.modal.edit") : t("budget.modal.add")}
          </h2>
          <button onClick={onClose} className="p-1 hover:bg-muted-bg rounded-lg">
            <X className="w-5 h-5 text-muted" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Category selection */}
          <div>
            <label className="text-sm font-medium text-card-foreground mb-2 block">{t("addTx.category")}</label>
            {editData ? (
              <div className="flex items-center gap-3 p-3 bg-muted-bg rounded-xl">
                {(() => {
                  const cat = categories.find((c) => c.id === editData.categoryId);
                  if (!cat) return <span className="text-muted text-sm">{editData.categoryName}</span>;
                  const Icon = getIcon(cat.icon);
                  return (
                    <>
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${cat.color}15` }}>
                        <Icon className="w-4 h-4" style={{ color: cat.color }} />
                      </div>
                      <span className="text-sm font-medium text-card-foreground">{cat.name}</span>
                    </>
                  );
                })()}
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-2 max-h-48 overflow-y-auto">
                {expenseCategories.map((cat) => {
                  const Icon = getIcon(cat.icon);
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setCategoryId(cat.id)}
                      className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border transition-colors ${
                        categoryId === cat.id
                          ? "border-primary-light bg-primary-light/10"
                          : "border-border hover:border-primary-light/30"
                      }`}
                    >
                      <Icon className="w-5 h-5" style={{ color: cat.color }} />
                      <span className="text-xs text-card-foreground truncate w-full text-center">{cat.name}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Amount */}
          <div>
            <label className="text-sm font-medium text-card-foreground mb-2 block">
              {t("budget.modal.limit")}
            </label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Ví dụ: 3000000"
              min="0"
              className="w-full px-4 py-3 bg-muted-bg border border-border rounded-xl text-lg font-semibold text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary-light/30"
            />
            {amount && Number(amount) > 0 && (
              <p className="text-xs text-muted mt-1">{formatVND(Number(amount))} {t("budget.modal.perMonth")}</p>
            )}
          </div>

          {error && (
            <p className="text-sm text-danger bg-danger/10 px-4 py-2 rounded-xl">{error}</p>
          )}

          <button
            type="submit"
            disabled={upsertBudget.isPending}
            className="w-full py-3 rounded-xl text-sm font-semibold text-white bg-primary hover:bg-primary-light transition-colors disabled:opacity-50"
          >
            {upsertBudget.isPending ? t("budget.modal.saving") : editData ? t("budget.modal.save") : t("budget.modal.add")}
          </button>
        </form>
      </div>
    </div>
  );
}
