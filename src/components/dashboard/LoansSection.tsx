"use client";

import { useState } from "react";
import { HandCoins, Plus, Trash2, Pencil, X, CheckCircle2, Clock, ChevronDown, ChevronUp } from "lucide-react";
import { useLoans, useAddLoan, useUpdateLoan, useDeleteLoan } from "@/lib/hooks";
import { formatVND, formatDateVN } from "@/lib/utils";
import type { LoanData } from "@/lib/api";

export default function LoansSection() {
  const { data, isLoading } = useLoans();
  const addLoan = useAddLoan();
  const updateLoan = useUpdateLoan();
  const deleteLoan = useDeleteLoan();

  const loans = data?.loans || [];
  const totalLent = data?.totalLent || 0;
  const unpaidLoans = loans.filter((l) => !l.isPaid);
  const paidLoans = loans.filter((l) => l.isPaid);

  const [expanded, setExpanded] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);

  // Form
  const [lender, setLender] = useState("");
  const [borrower, setBorrower] = useState("");
  const [amount, setAmount] = useState("");
  const [rate, setRate] = useState("");
  const [date, setDate] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [note, setNote] = useState("");

  function resetForm() {
    setLender(""); setBorrower(""); setAmount(""); setRate("");
    setDate(""); setDueDate(""); setNote("");
  }

  function openEdit(loan: LoanData) {
    setEditId(loan.id);
    setLender(loan.lender);
    setBorrower(loan.borrower);
    setAmount(loan.amount.toString());
    setRate(loan.interestRate?.toString() || "");
    setDate(loan.date ? loan.date.slice(0, 10) : "");
    setDueDate(loan.dueDate ? loan.dueDate.slice(0, 10) : "");
    setNote(loan.note || "");
    setShowAdd(true);
  }

  function handleSubmit() {
    if (!lender.trim() || !borrower.trim() || !amount) return;
    const payload = {
      lender: lender.trim(),
      borrower: borrower.trim(),
      amount: Number(amount),
      interestRate: rate ? Number(rate) : null,
      date: date || undefined,
      dueDate: dueDate || undefined,
      note: note || null,
    };

    if (editId) {
      updateLoan.mutate({ id: editId, data: payload }, { onSuccess: () => { setShowAdd(false); setEditId(null); resetForm(); } });
    } else {
      addLoan.mutate(payload, { onSuccess: () => { setShowAdd(false); resetForm(); } });
    }
  }

  if (isLoading) return null;

  return (
    <div className="bg-card rounded-2xl border border-border overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-5 cursor-pointer" onClick={() => setExpanded(!expanded)}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-danger/10 flex items-center justify-center">
            <HandCoins className="w-5 h-5 text-danger" />
          </div>
          <div>
            <p className="text-sm font-semibold text-card-foreground">Cho vay</p>
            <p className="text-xs text-muted">{unpaidLoans.length} chưa trả · {paidLoans.length} đã trả</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="text-lg font-bold text-danger">{formatVND(totalLent)}</p>
            <p className="text-xs text-muted">chưa thu</p>
          </div>
          {expanded ? <ChevronUp className="w-4 h-4 text-muted" /> : <ChevronDown className="w-4 h-4 text-muted" />}
        </div>
      </div>

      {expanded && (
        <div className="px-5 pb-5 space-y-2">
          {/* Loan list */}
          {loans.length > 0 && (
            <div className="border-t border-border pt-3 space-y-2">
              {loans.map((loan) => {
                const daysLeft = loan.dueDate ? Math.ceil((new Date(loan.dueDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)) : null;
                const isOverdue = daysLeft !== null && daysLeft < 0 && !loan.isPaid;

                return (
                  <div key={loan.id} className={`p-3 rounded-xl border ${loan.isPaid ? "border-accent/30 bg-accent/5" : isOverdue ? "border-danger/30 bg-danger/5" : "border-border"}`}>
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium text-card-foreground">
                            {loan.lender} → {loan.borrower}
                          </p>
                          {loan.isPaid && <span className="text-xs bg-accent/10 text-accent px-1.5 py-0.5 rounded">Đã trả</span>}
                          {isOverdue && <span className="text-xs bg-danger/10 text-danger px-1.5 py-0.5 rounded">Quá hạn</span>}
                        </div>
                        <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1 text-xs text-muted">
                          {loan.interestRate && <span>Lãi: {loan.interestRate}%/năm</span>}
                          <span>{formatDateVN(loan.date)}</span>
                          {loan.dueDate && (
                            <span className="flex items-center gap-0.5">
                              <Clock className="w-3 h-3" />
                              Hạn: {formatDateVN(loan.dueDate)}
                              {daysLeft !== null && daysLeft > 0 && !loan.isPaid && ` (${daysLeft} ngày)`}
                            </span>
                          )}
                        </div>
                        {loan.note && <p className="text-xs text-muted mt-1 italic">{loan.note}</p>}
                      </div>
                      <div className="flex items-center gap-2 ml-3">
                        <span className="text-sm font-bold text-card-foreground">{formatVND(loan.amount)}</span>
                        {!loan.isPaid && (
                          <button onClick={(e) => { e.stopPropagation(); updateLoan.mutate({ id: loan.id, data: { isPaid: true } }); }}
                            className="p-1 text-muted hover:text-accent rounded-lg transition-colors" title="Đánh dấu đã trả">
                            <CheckCircle2 className="w-4 h-4" />
                          </button>
                        )}
                        <button onClick={(e) => { e.stopPropagation(); openEdit(loan); }}
                          className="p-1 text-muted hover:text-primary-light rounded-lg transition-colors">
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); deleteLoan.mutate(loan.id); }}
                          className="p-1 text-muted hover:text-danger rounded-lg transition-colors">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Add/Edit form */}
          {showAdd ? (
            <div className="mt-3 pt-3 border-t border-border space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <input type="text" value={lender} onChange={(e) => setLender(e.target.value)} placeholder="Người cho vay"
                  className="px-3 py-2 bg-muted-bg border border-border rounded-xl text-sm text-foreground placeholder:text-muted focus:outline-none" />
                <input type="text" value={borrower} onChange={(e) => setBorrower(e.target.value)} placeholder="Người vay"
                  className="px-3 py-2 bg-muted-bg border border-border rounded-xl text-sm text-foreground placeholder:text-muted focus:outline-none" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="Số tiền"
                  className="px-3 py-2.5 bg-muted-bg border border-border rounded-xl text-sm font-semibold text-foreground placeholder:text-muted focus:outline-none" />
                <input type="number" step="0.1" value={rate} onChange={(e) => setRate(e.target.value)} placeholder="Lãi suất %/năm"
                  className="px-3 py-2 bg-muted-bg border border-border rounded-xl text-sm text-foreground placeholder:text-muted focus:outline-none" />
              </div>
              {amount && Number(amount) > 0 && <p className="text-xs text-muted">{formatVND(Number(amount))}</p>}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-muted mb-1 block">Ngày cho vay</label>
                  <input type="date" value={date} onChange={(e) => setDate(e.target.value)}
                    className="w-full px-3 py-2 bg-muted-bg border border-border rounded-xl text-sm text-foreground focus:outline-none" />
                </div>
                <div>
                  <label className="text-xs text-muted mb-1 block">Ngày trả (dự kiến)</label>
                  <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)}
                    className="w-full px-3 py-2 bg-muted-bg border border-border rounded-xl text-sm text-foreground focus:outline-none" />
                </div>
              </div>
              <input type="text" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Ghi chú"
                className="w-full px-3 py-2 bg-muted-bg border border-border rounded-xl text-sm text-foreground placeholder:text-muted focus:outline-none" />
              <div className="flex gap-2">
                <button onClick={handleSubmit} disabled={addLoan.isPending || updateLoan.isPending}
                  className="flex-1 py-2 bg-danger text-white text-sm font-medium rounded-xl hover:bg-danger/90 transition-colors disabled:opacity-50">
                  {editId ? "Lưu" : "Thêm"}
                </button>
                <button onClick={() => { setShowAdd(false); setEditId(null); resetForm(); }}
                  className="px-4 py-2 bg-muted-bg text-muted text-sm rounded-xl">Hủy</button>
              </div>
            </div>
          ) : (
            <button onClick={() => { resetForm(); setEditId(null); setShowAdd(true); }}
              className="flex items-center gap-2 w-full p-2.5 rounded-xl border border-dashed border-border hover:border-danger text-muted hover:text-danger transition-colors text-sm">
              <Plus className="w-4 h-4" /> Thêm khoản vay
            </button>
          )}
        </div>
      )}
    </div>
  );
}
