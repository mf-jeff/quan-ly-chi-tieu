"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { X } from "lucide-react";
import { useCategories, useAddTransaction } from "@/lib/hooks";
import { getIcon } from "@/lib/icon-map";
import { formatVND, toVNISOString, safeEvalExpr } from "@/lib/utils";
import { useT } from "@/lib/i18n";
import type { TransactionType } from "@/lib/types";

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function AddTransactionModal({ open, onClose }: Props) {
  const { data: catData } = useCategories();
  const addTx = useAddTransaction();
  const t = useT();
  const categories = catData?.categories || [];

  const [type, setType] = useState<TransactionType>("expense");
  const [categoryId, setCategoryId] = useState("");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [payer, setPayer] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [payers, setPayers] = useState<{name: string; color: string}[]>([]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("payer-list");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.length > 0 && typeof parsed[0] === "string") {
          setPayers(parsed.map((name: string) => ({ name, color: "#3b82f6" })));
        } else {
          setPayers(parsed);
        }
      }
    } catch { /* empty */ }
  }, [open]);
  const [dateVal, setDateVal] = useState(() => { const d = toVNISOString(new Date()); return d.slice(0, 10); });
  const [timeVal, setTimeVal] = useState(() => { const d = toVNISOString(new Date()); return d.slice(11, 16); });
  const [error, setError] = useState("");

  const filtered = categories.filter((c) => c.type === type || c.type === "both");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    let parsedAmount = Number(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      // Try evaluating as expression (e.g. 70+17+40)
      try {
        parsedAmount = safeEvalExpr(amount);
      } catch { parsedAmount = 0; }
    }
    if (!parsedAmount || parsedAmount <= 0) { setError(t("addTx.error.amount")); return; }
    if (!categoryId) { setError(t("addTx.error.category")); return; }

    addTx.mutate(
      { amount: parsedAmount, type, categoryId, note: note.trim(), payer: payer.trim(), paymentMethod, date: new Date(`${dateVal}T${timeVal}`).toISOString() },
      {
        onSuccess: () => {
          setType("expense"); setCategoryId(""); setAmount(""); setNote(""); setPayer(""); setPaymentMethod("cash"); setDateVal(toVNISOString(new Date()).slice(0,10)); setTimeVal(toVNISOString(new Date()).slice(11,16));
          onClose();
        },
      }
    );
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-card rounded-2xl border border-border shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-border">
          <h2 className="text-lg font-semibold text-card-foreground">{t("addTx.title")}</h2>
          <button onClick={onClose} className="p-1 hover:bg-muted-bg rounded-lg"><X className="w-5 h-5 text-muted" /></button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="text-sm font-medium text-card-foreground mb-2 block">{t("addTx.type")}</label>
            <div className="flex gap-2 bg-muted-bg rounded-xl p-1">
              <button type="button" onClick={() => { setType("expense"); setCategoryId(""); }}
                className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${type === "expense" ? "bg-danger text-white" : "text-muted"}`}>{t("tx.expense")}</button>
              <button type="button" onClick={() => { setType("income"); setCategoryId(""); }}
                className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${type === "income" ? "bg-accent text-white" : "text-muted"}`}>{t("tx.income")}</button>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-card-foreground mb-2 block">Số tiền (VND)</label>
            <input type="text" inputMode="text" value={amount} onChange={(e) => setAmount(e.target.value)}
              placeholder="VD: 50000 hoặc 70+17+40"
              className="w-full px-4 py-3 bg-muted-bg border border-border rounded-xl text-lg font-semibold text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary-light/30" />
            <div className="flex gap-1.5 mt-1.5">
              {["+", "-", "*", "/", "(", ")"].map((op) => (
                <button key={op} type="button" onClick={() => setAmount(amount + op)}
                  className="flex-1 py-1.5 bg-muted-bg border border-border rounded-lg text-sm font-bold text-muted hover:text-primary-light hover:border-primary-light/30 transition-colors">{op}</button>
              ))}
            </div>
            {amount && (() => {
              try {
                const result = safeEvalExpr(amount);
                if (typeof result === "number" && result > 0 && !isNaN(result)) {
                  return <p className="text-xs text-accent mt-1">= {formatVND(result)}</p>;
                }
              } catch { /* invalid expression */ }
              return amount && !isNaN(Number(amount)) && Number(amount) > 0
                ? <p className="text-xs text-muted mt-1">{formatVND(Number(amount))}</p>
                : null;
            })()}
          </div>

          <div>
            <label className="text-sm font-medium text-card-foreground mb-2 block">{t("addTx.category")}</label>
            <div className="grid grid-cols-3 gap-2">
              {filtered.map((cat) => {
                const Icon = getIcon(cat.icon);
                return (
                  <button key={cat.id} type="button" onClick={() => setCategoryId(cat.id)}
                    className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border transition-colors ${categoryId === cat.id ? "border-primary-light bg-primary-light/10" : "border-border hover:border-primary-light/30"}`}>
                    <Icon className="w-5 h-5" style={{ color: cat.color }} />
                    <span className="text-xs text-card-foreground truncate w-full text-center">{cat.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-card-foreground mb-2 block">{t("addTx.note")}</label>
            <textarea ref={(el) => { if (el) { el.style.height = "auto"; el.style.height = el.scrollHeight + "px"; } }} value={note} onChange={(e) => { setNote(e.target.value); e.target.style.height = "auto"; e.target.style.height = e.target.scrollHeight + "px"; }} placeholder={t("addTx.notePlaceholder")} rows={1}
              className="w-full px-4 py-2.5 bg-muted-bg border border-border rounded-xl text-sm text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary-light/30 resize-none overflow-hidden" />
          </div>

          {/* Người */}
          <div>
            <label className="text-sm font-medium text-card-foreground mb-2 block">Người</label>
            {payers.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {payers.map((p) => (
                  <button key={p.name} type="button" onClick={() => setPayer(payer === p.name ? "" : p.name)}
                    className={`px-4 py-2 rounded-xl border text-sm font-medium transition-colors ${
                      payer === p.name ? "border-2" : "border-border hover:opacity-80"
                    }`}
                    style={payer === p.name ? { borderColor: p.color, backgroundColor: `${p.color}15`, color: p.color } : { color: p.color }}>
                    {p.name}
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted bg-muted-bg rounded-xl px-4 py-2.5">Vào Cài đặt để thêm người</p>
            )}
          </div>

          {/* Hình thức thanh toán */}
          <div>
            <label className="text-sm font-medium text-card-foreground mb-2 block">Thanh toán bằng</label>
            <div className="grid grid-cols-3 gap-2">
              {([
                { key: "cash", label: "Tiền mặt", icon: "💵" },
                { key: "bank", label: "Chuyển khoản", icon: "🏦" },
                { key: "card", label: "Thẻ", icon: "💳" },
              ]).map((m) => (
                <button key={m.key} type="button" onClick={() => setPaymentMethod(m.key)}
                  className={`flex items-center justify-center gap-1.5 py-2.5 rounded-xl border text-xs font-medium transition-colors ${
                    paymentMethod === m.key ? "border-primary-light bg-primary-light/10 text-primary-light" : "border-border text-muted hover:border-primary-light/30"
                  }`}>
                  <span>{m.icon}</span>{m.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-card-foreground mb-2 block">{t("addTx.date")}</label>
            <div className="flex gap-2">
              <input type="date" value={dateVal} onChange={(e) => setDateVal(e.target.value)}
                className="flex-1 px-4 py-2.5 bg-muted-bg border border-border rounded-xl text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary-light/30" />
              <input type="time" value={timeVal} onChange={(e) => setTimeVal(e.target.value)}
                className="w-28 px-4 py-2.5 bg-muted-bg border border-border rounded-xl text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary-light/30" />
            </div>
          </div>

          {error && <p className="text-sm text-danger bg-danger/10 px-4 py-2 rounded-xl">{error}</p>}

          <button type="submit" disabled={addTx.isPending}
            className={`w-full py-3 rounded-xl text-sm font-semibold text-white transition-colors disabled:opacity-50 ${type === "expense" ? "bg-danger hover:bg-danger/90" : "bg-accent hover:bg-accent/90"}`}>
            {addTx.isPending ? t("addTx.adding") : type === "expense" ? t("addTx.submit.expense") : t("addTx.submit.income")}
          </button>
        </form>
      </div>
    </div>
  );
}
