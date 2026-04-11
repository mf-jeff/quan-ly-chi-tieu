"use client";

import { useState } from "react";
import { Plus, Trash2, Pencil, CheckCircle2, Clock, ChevronDown, ChevronUp, ArrowUpRight, ArrowDownRight, User } from "lucide-react";
import { useLoans, useAddLoan, useUpdateLoan, useDeleteLoan } from "@/lib/hooks";
import { formatVND, formatDateVN } from "@/lib/utils";
import type { LoanData } from "@/lib/api";
import type { LucideProps } from "lucide-react";

function LoanForm({ type, onSubmit, onCancel, editData, isPending }: {
  type: "lend" | "borrow";
  onSubmit: (data: Record<string, unknown>) => void;
  onCancel: () => void;
  editData?: LoanData | null;
  isPending: boolean;
}) {
  const [lender, setLender] = useState(editData?.lender || "");
  const [borrower, setBorrower] = useState(editData?.borrower || "");
  const [amount, setAmount] = useState(editData?.amount.toString() || "");
  const [rate, setRate] = useState(editData?.interestRate?.toString() || "");
  const [date, setDate] = useState(editData?.date ? editData.date.slice(0, 10) : "");
  const [dueDate, setDueDate] = useState(editData?.dueDate ? editData.dueDate.slice(0, 10) : "");
  const [note, setNote] = useState(editData?.note || "");

  return (
    <div className="mt-3 pt-3 border-t border-border space-y-3">
      <div className="grid grid-cols-2 gap-2">
        <input type="text" value={lender} onChange={(e) => setLender(e.target.value)}
          placeholder={type === "lend" ? "Bạn (người cho vay)" : "Người cho vay"}
          className="px-3 py-2 bg-muted-bg border border-border rounded-xl text-sm text-foreground placeholder:text-muted focus:outline-none" />
        <input type="text" value={borrower} onChange={(e) => setBorrower(e.target.value)}
          placeholder={type === "lend" ? "Người vay" : "Bạn (người vay)"}
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
          <label className="text-xs text-muted mb-1 block">{type === "lend" ? "Ngày cho vay" : "Ngày vay"}</label>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)}
            className="w-full px-3 py-2 bg-muted-bg border border-border rounded-xl text-sm text-foreground focus:outline-none" />
        </div>
        <div>
          <label className="text-xs text-muted mb-1 block">Ngày trả</label>
          <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)}
            className="w-full px-3 py-2 bg-muted-bg border border-border rounded-xl text-sm text-foreground focus:outline-none" />
        </div>
      </div>
      <input type="text" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Ghi chú"
        className="w-full px-3 py-2 bg-muted-bg border border-border rounded-xl text-sm text-foreground placeholder:text-muted focus:outline-none" />
      <div className="flex gap-2">
        <button onClick={() => { if (!lender.trim() || !borrower.trim() || !amount) return; onSubmit({ type, lender: lender.trim(), borrower: borrower.trim(), amount: Number(amount), interestRate: rate ? Number(rate) : null, date: date || undefined, dueDate: dueDate || undefined, note: note || null }); }}
          disabled={isPending}
          className={`flex-1 py-2 text-white text-sm font-medium rounded-xl transition-colors disabled:opacity-50 ${type === "lend" ? "bg-danger hover:bg-danger/90" : "bg-warning hover:bg-warning/90"}`}>
          {editData ? "Lưu" : "Thêm"}
        </button>
        <button onClick={onCancel} className="px-4 py-2 bg-muted-bg text-muted text-sm rounded-xl">Hủy</button>
      </div>
    </div>
  );
}

interface PersonGroup {
  name: string;
  loans: LoanData[];
  totalAmount: number;
  unpaidAmount: number;
  unpaidCount: number;
}

function LoanBlock({ type, icon: Icon, color, title, loans, totalUnpaid }: {
  type: "lend" | "borrow"; icon: React.ComponentType<LucideProps>; color: string; title: string;
  loans: LoanData[]; totalUnpaid: number;
}) {
  const addLoan = useAddLoan();
  const updateLoan = useUpdateLoan();
  const deleteLoan = useDeleteLoan();

  const [expanded, setExpanded] = useState(false);
  const [expandedPerson, setExpandedPerson] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [editData, setEditData] = useState<LoanData | null>(null);

  const unpaid = loans.filter((l) => !l.isPaid).length;
  const paid = loans.filter((l) => l.isPaid).length;

  // Group by person
  const personKey = type === "lend" ? "borrower" : "lender";
  const groups: PersonGroup[] = [];
  const groupMap: Record<string, PersonGroup> = {};
  loans.forEach((loan) => {
    const name = loan[personKey as keyof LoanData] as string;
    if (!groupMap[name]) {
      groupMap[name] = { name, loans: [], totalAmount: 0, unpaidAmount: 0, unpaidCount: 0 };
      groups.push(groupMap[name]);
    }
    groupMap[name].loans.push(loan);
    groupMap[name].totalAmount += loan.amount;
    if (!loan.isPaid) {
      groupMap[name].unpaidAmount += loan.amount;
      groupMap[name].unpaidCount++;
    }
  });
  groups.sort((a, b) => b.unpaidAmount - a.unpaidAmount);

  return (
    <div className="bg-card rounded-2xl border border-border overflow-hidden">
      {/* Section header */}
      <div className="flex items-center justify-between p-5 cursor-pointer" onClick={() => setExpanded(!expanded)}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: color === "text-danger" ? "rgba(239,68,68,0.1)" : "rgba(245,158,11,0.1)" }}>
            <Icon className={`w-5 h-5 ${color}`} />
          </div>
          <div>
            <p className="text-sm font-semibold text-card-foreground">{title}</p>
            <p className="text-xs text-muted">{groups.length} người · {unpaid} chưa trả · {paid} đã trả</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className={`text-lg font-bold ${color}`}>{formatVND(totalUnpaid)}</p>
            <p className="text-xs text-muted">{type === "lend" ? "chưa thu" : "còn nợ"}</p>
          </div>
          {expanded ? <ChevronUp className="w-4 h-4 text-muted" /> : <ChevronDown className="w-4 h-4 text-muted" />}
        </div>
      </div>

      {expanded && (
        <div className="px-5 pb-5 space-y-2">
          {groups.length > 0 && (
            <div className="border-t border-border pt-3 space-y-2">
              {groups.map((group) => {
                const isOpen = expandedPerson === group.name;
                return (
                  <div key={group.name} className="rounded-xl border border-border overflow-hidden">
                    {/* Person header */}
                    <div className="flex items-center justify-between p-3 cursor-pointer hover:bg-muted-bg/50 transition-colors"
                      onClick={() => setExpandedPerson(isOpen ? null : group.name)}>
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-primary-light/10 flex items-center justify-center">
                          <User className="w-4 h-4 text-primary-light" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-card-foreground">{group.name}</p>
                          <p className="text-xs text-muted">{group.loans.length} khoản · {group.unpaidCount} chưa trả</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="text-right">
                          <p className={`text-sm font-bold ${group.unpaidAmount > 0 ? color : "text-accent"}`}>
                            {formatVND(group.unpaidAmount)}
                          </p>
                          {group.unpaidAmount === 0 && <p className="text-[10px] text-accent">Đã trả hết</p>}
                        </div>
                        {isOpen ? <ChevronUp className="w-3.5 h-3.5 text-muted" /> : <ChevronDown className="w-3.5 h-3.5 text-muted" />}
                      </div>
                    </div>

                    {/* Person's loans */}
                    {isOpen && (
                      <div className="border-t border-border px-3 pb-3 pt-2 space-y-1.5 bg-muted-bg/30">
                        {group.loans.map((loan) => {
                          const daysLeft = loan.dueDate ? Math.ceil((new Date(loan.dueDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)) : null;
                          const isOverdue = daysLeft !== null && daysLeft < 0 && !loan.isPaid;

                          return (
                            <div key={loan.id} className={`p-2.5 rounded-lg border ${loan.isPaid ? "border-accent/30 bg-accent/5" : isOverdue ? "border-danger/20 bg-danger/5" : "border-border bg-card"}`}>
                              <div className="flex items-center justify-between">
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-1.5">
                                    <span className="text-sm font-semibold text-card-foreground">{formatVND(loan.amount)}</span>
                                    {loan.isPaid && <span className="text-[10px] bg-accent/10 text-accent px-1 py-0.5 rounded">Đã trả</span>}
                                    {isOverdue && <span className="text-[10px] bg-danger/10 text-danger px-1 py-0.5 rounded">Quá hạn</span>}
                                  </div>
                                  <div className="flex flex-wrap gap-x-2 mt-0.5 text-[11px] text-muted">
                                    <span>{formatDateVN(loan.date)}</span>
                                    {loan.interestRate && <span>Lãi {loan.interestRate}%</span>}
                                    {loan.dueDate && <span className="flex items-center gap-0.5"><Clock className="w-2.5 h-2.5" />Hạn: {formatDateVN(loan.dueDate)}{daysLeft && daysLeft > 0 && !loan.isPaid && ` (${daysLeft}d)`}</span>}
                                    {loan.note && <span className="italic">{loan.note}</span>}
                                  </div>
                                </div>
                                <div className="flex items-center gap-0.5 ml-2 shrink-0">
                                  {!loan.isPaid && <button onClick={() => updateLoan.mutate({ id: loan.id, data: { isPaid: true } })} className="p-1 text-muted hover:text-accent rounded" title="Đã trả"><CheckCircle2 className="w-3.5 h-3.5" /></button>}
                                  <button onClick={() => { setEditData(loan); setShowAdd(true); }} className="p-1 text-muted hover:text-primary-light rounded"><Pencil className="w-3 h-3" /></button>
                                  <button onClick={() => deleteLoan.mutate(loan.id)} className="p-1 text-muted hover:text-danger rounded"><Trash2 className="w-3 h-3" /></button>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Add form */}
          {showAdd ? (
            <LoanForm type={type} editData={editData} isPending={addLoan.isPending || updateLoan.isPending}
              onSubmit={(data) => {
                if (editData) {
                  updateLoan.mutate({ id: editData.id, data }, { onSuccess: () => { setShowAdd(false); setEditData(null); } });
                } else {
                  addLoan.mutate(data, { onSuccess: () => setShowAdd(false) });
                }
              }}
              onCancel={() => { setShowAdd(false); setEditData(null); }} />
          ) : (
            <button onClick={() => { setEditData(null); setShowAdd(true); }}
              className={`flex items-center gap-2 w-full p-2.5 rounded-xl border border-dashed border-border text-muted hover:${color} transition-colors text-sm`}>
              <Plus className="w-4 h-4" /> Thêm {type === "lend" ? "khoản cho vay" : "khoản vay"}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export default function LoansSection() {
  const { data, isLoading } = useLoans();
  if (isLoading) return null;

  const loans = data?.loans || [];
  const lendLoans = loans.filter((l) => l.type === "lend");
  const borrowLoans = loans.filter((l) => l.type === "borrow");
  const totalLentUnpaid = lendLoans.filter((l) => !l.isPaid).reduce((s, l) => s + l.amount, 0);
  const totalBorrowUnpaid = borrowLoans.filter((l) => !l.isPaid).reduce((s, l) => s + l.amount, 0);

  return (
    <div className="space-y-4">
      <LoanBlock type="lend" icon={ArrowUpRight} color="text-danger" title="Cho vay"
        loans={lendLoans} totalUnpaid={totalLentUnpaid} />
      <LoanBlock type="borrow" icon={ArrowDownRight} color="text-warning" title="Đi vay"
        loans={borrowLoans} totalUnpaid={totalBorrowUnpaid} />
    </div>
  );
}
