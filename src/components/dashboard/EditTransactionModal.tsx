"use client";

import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { useCategories, usePayers } from "@/lib/hooks";
import { transactionApi } from "@/lib/api";
import { getIcon } from "@/lib/icon-map";
import { formatVND, toVNISOString, safeEvalExpr } from "@/lib/utils";
import { useT } from "@/lib/i18n";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type { TransactionType } from "@/lib/types";

interface EditData {
  id: string;
  type: string;
  categoryId: string;
  amount: number;
  note: string;
  payer: string;
  paymentMethod: string;
  date: string;
}

interface Props {
  open: boolean;
  onClose: () => void;
  data: EditData | null;
}

export default function EditTransactionModal({ open, onClose, data }: Props) {
  const { data: catData } = useCategories();
  const qc = useQueryClient();
  const t = useT();
  const categories = catData?.categories || [];

  const [type, setType] = useState<TransactionType>("expense");
  const [categoryId, setCategoryId] = useState("");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [payer, setPayer] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [date, setDate] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const { data: payerData } = usePayers();
  const payers = payerData?.payers || [];

  useEffect(() => {
    if (data) {
      setType(data.type as TransactionType);
      setCategoryId(data.categoryId);
      setAmount(data.amount.toString());
      setNote(data.note);
      setPayer(data.payer);
      setPaymentMethod(data.paymentMethod);
      setDate(toVNISOString(new Date(data.date)));
      setError("");
    }
  }, [data]);


  const filtered = categories.filter((c) => c.type === type || c.type === "both");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!data) return;
    setError("");
    let parsedAmount = Number(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      try {
        parsedAmount = safeEvalExpr(amount);
      } catch { parsedAmount = 0; }
    }
    if (!parsedAmount || parsedAmount <= 0) { setError(t("addTx.error.amount")); return; }
    if (!categoryId) { setError(t("addTx.error.category")); return; }

    setSaving(true);
    try {
      await transactionApi.update(data.id, {
        amount: parsedAmount,
        type,
        categoryId,
        note: note.trim(),
        payer: payer.trim(),
        paymentMethod,
        date: new Date(date).toISOString(),
      });
      qc.invalidateQueries({ queryKey: ["transactions"] });
      qc.invalidateQueries({ queryKey: ["budgets"] });
      toast.success("Đã cập nhật giao dịch");
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Lỗi");
    } finally {
      setSaving(false);
    }
  }

  if (!open || !data) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-card rounded-2xl border border-border shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-border">
          <h2 className="text-lg font-semibold text-card-foreground">Chỉnh sửa giao dịch</h2>
          <button onClick={onClose} className="p-1 hover:bg-muted-bg rounded-lg"><X className="w-5 h-5 text-muted" /></button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Type */}
          <div>
            <label className="text-sm font-medium text-card-foreground mb-2 block">{t("addTx.type")}</label>
            <div className="flex gap-2 bg-muted-bg rounded-xl p-1">
              <button type="button" onClick={() => { setType("expense"); setCategoryId(""); }}
                className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${type === "expense" ? "bg-danger text-white" : "text-muted"}`}>{t("tx.expense")}</button>
              <button type="button" onClick={() => { setType("income"); setCategoryId(""); }}
                className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${type === "income" ? "bg-accent text-white" : "text-muted"}`}>{t("tx.income")}</button>
            </div>
          </div>

          {/* Amount */}
          <div>
            <label className="text-sm font-medium text-card-foreground mb-2 block">{t("addTx.amount")}</label>
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
              } catch { /* invalid */ }
              return amount && !isNaN(Number(amount)) && Number(amount) > 0
                ? <p className="text-xs text-muted mt-1">{formatVND(Number(amount))}</p>
                : null;
            })()}
          </div>

          {/* Category */}
          <div>
            <label className="text-sm font-medium text-card-foreground mb-2 block">{t("addTx.category")}</label>
            <div className="grid grid-cols-3 gap-2">
              {filtered.map((cat) => {
                const CatIcon = getIcon(cat.icon);
                return (
                  <button key={cat.id} type="button" onClick={() => setCategoryId(cat.id)}
                    className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border transition-colors ${categoryId === cat.id ? "border-primary-light bg-primary-light/10" : "border-border hover:border-primary-light/30"}`}>
                    <CatIcon className="w-5 h-5" style={{ color: cat.color }} />
                    <span className="text-xs text-card-foreground truncate w-full text-center">{cat.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Note */}
          <div>
            <label className="text-sm font-medium text-card-foreground mb-2 block">{t("addTx.note")}</label>
            <textarea ref={(el) => { if (el) { el.style.height = "auto"; el.style.height = el.scrollHeight + "px"; } }} value={note} onChange={(e) => { setNote(e.target.value); e.target.style.height = "auto"; e.target.style.height = e.target.scrollHeight + "px"; }} placeholder={t("addTx.notePlaceholder")} rows={1}
              className="w-full px-4 py-2.5 bg-muted-bg border border-border rounded-xl text-sm text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary-light/30 resize-none overflow-hidden" />
          </div>

          {/* Payer */}
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
              <input type="text" value={payer} onChange={(e) => setPayer(e.target.value)} placeholder="Người..."
                className="w-full px-4 py-2.5 bg-muted-bg border border-border rounded-xl text-sm text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary-light/30" />
            )}
          </div>

          {/* Payment method */}
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

          {/* Date */}
          <div>
            <label className="text-sm font-medium text-card-foreground mb-2 block">{t("addTx.date")}</label>
            <div className="flex gap-2">
              <input type="date" value={date.slice(0, 10)} onChange={(e) => setDate(e.target.value + date.slice(10))}
                className="flex-1 px-4 py-2.5 bg-muted-bg border border-border rounded-xl text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary-light/30" />
              <input type="time" value={date.slice(11, 16)} onChange={(e) => setDate(date.slice(0, 11) + e.target.value)}
                className="w-28 px-4 py-2.5 bg-muted-bg border border-border rounded-xl text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary-light/30" />
            </div>
          </div>

          {error && <p className="text-sm text-danger bg-danger/10 px-4 py-2 rounded-xl">{error}</p>}

          <button type="submit" disabled={saving}
            className="w-full py-3 rounded-xl text-sm font-semibold text-white bg-primary hover:bg-primary-light transition-colors disabled:opacity-50">
            {saving ? "Đang lưu..." : "Lưu thay đổi"}
          </button>
        </form>
      </div>
    </div>
  );
}
