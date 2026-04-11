"use client";

import { useState, useRef, useMemo } from "react";
import { ArrowRightLeft, Search, Filter, Plus, ArrowUpRight, ArrowDownRight, Trash2, Settings2, CalendarDays, X, Upload, FileSpreadsheet, CheckCircle2, AlertTriangle, Pencil } from "lucide-react";
import { ListSkeleton } from "@/components/ui/Skeleton";
import { useTransactions, useDeleteTransaction, useCategories, usePayers } from "@/lib/hooks";
import { useQueryClient } from "@tanstack/react-query";
import { getIcon } from "@/lib/icon-map";
import { formatVND, formatDateVN, formatDateShort } from "@/lib/utils";
import { getToken } from "@/lib/api";
import { useT } from "@/lib/i18n";
import { toast } from "sonner";
import AddTransactionModal from "@/components/dashboard/AddTransactionModal";
import EditTransactionModal from "@/components/dashboard/EditTransactionModal";
import CategoryManager from "@/components/dashboard/CategoryManager";

type DateFilter = "all" | "day" | "month" | "year";

function getDateRange(mode: DateFilter, date: string): { startDate?: string; endDate?: string } {
  if (mode === "all" || !date) return {};
  if (mode === "day") {
    const d = new Date(date);
    const start = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    const end = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59);
    return { startDate: start.toISOString(), endDate: end.toISOString() };
  }
  if (mode === "month") {
    const [y, m] = date.split("-").map(Number);
    const start = new Date(y, m - 1, 1);
    const end = new Date(y, m, 0, 23, 59, 59);
    return { startDate: start.toISOString(), endDate: end.toISOString() };
  }
  if (mode === "year") {
    const y = Number(date);
    return { startDate: new Date(y, 0, 1).toISOString(), endDate: new Date(y, 11, 31, 23, 59, 59).toISOString() };
  }
  return {};
}

export default function TransactionsPage() {
  const t = useT();
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [filterCategory, setFilterCategory] = useState("all");
  const [dateFilter, setDateFilter] = useState<DateFilter>("month");
  const [dateValue, setDateValue] = useState(new Date().toISOString().slice(0, 7));
  const [filterPayer, setFilterPayer] = useState("all");
  const { data: payerData } = usePayers();
  const payerList = payerData?.payers || [];

  const payerColors = useMemo(() => {
    const map: Record<string, string> = {};
    payerList.forEach((p) => { map[p.name] = p.color; });
    return map;
  }, [payerList]);

  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [page, setPage] = useState(1);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showCategoryManager, setShowCategoryManager] = useState(false);
  const [editTx, setEditTx] = useState<{ id: string; type: string; categoryId: string; amount: number; note: string; payer: string; paymentMethod: string; date: string } | null>(null);
  const [showImport, setShowImport] = useState(false);
  const [confirmBatchDelete, setConfirmBatchDelete] = useState(false);
  const [importing, setImporting] = useState(false);
  const [amountUnit, setAmountUnit] = useState<"dong" | "k">("k");
  const [importResult, setImportResult] = useState<{ imported: number; skipped: number; total: number; categoriesCreated?: number; newCategories?: string[]; errors: string[] } | null>(null);
  const [showImportDetails, setShowImportDetails] = useState<string | null>(null); // "imported" | "skipped" | "categories"
  const fileRef = useRef<HTMLInputElement>(null);
  const qc = useQueryClient();

  // Build params
  const dateRange = getDateRange(dateFilter, dateValue);
  const params: Record<string, string> = {};
  if (filterType !== "all") params.type = filterType;
  if (filterCategory !== "all") params.categoryId = filterCategory;
  if (search) params.search = search;
  if (dateFilter === "all") {
    params.startDate = "2000-01-01T00:00:00.000Z";
    params.endDate = "2099-12-31T23:59:59.000Z";
  } else if (dateRange.startDate && dateRange.endDate) {
    params.startDate = dateRange.startDate;
    params.endDate = dateRange.endDate;
  }
  params.page = page.toString();
  params.limit = "50";

  const { data, isLoading } = useTransactions(params);
  const { data: catData } = useCategories();
  const deleteTx = useDeleteTransaction();

  const allTxs = data?.transactions || [];
  const pagination = data?.pagination || { page: 1, limit: 50, total: 0, totalPages: 1 };
  const serverTotals = data?.totals || { income: 0, expense: 0 };
  const categories = catData?.categories || [];

  // Client-side filter by payer
  const txs = filterPayer === "all" ? allTxs
    : filterPayer === "_empty" ? allTxs.filter((tx) => !tx.payer)
    : allTxs.filter((tx) => tx.payer === filterPayer);

  const totalIncome = filterPayer !== "all"
    ? txs.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0)
    : serverTotals.income;
  const totalExpense = filterPayer !== "all"
    ? txs.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0)
    : serverTotals.expense;

  // Set default date value when switching filter mode
  function handleDateFilterChange(mode: DateFilter) {
    setDateFilter(mode);
    setPage(1);
    if (mode === "day") setDateValue(new Date().toISOString().slice(0, 10));
    else if (mode === "month") setDateValue(new Date().toISOString().slice(0, 7));
    else if (mode === "year") setDateValue(new Date().getFullYear().toString());
    else setDateValue("");
  }

  async function handleImport(file: File) {
    setImporting(true);
    setImportResult(null);
    try {
      const token = getToken();
      const form = new FormData();
      form.append("file", file);
      form.append("amountUnit", amountUnit);
      const res = await fetch("/api/import", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: form,
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      setImportResult(json);
      qc.invalidateQueries({ queryKey: ["transactions"] });
      toast.success(`Đã nhập ${json.imported} giao dịch`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Import thất bại");
    } finally {
      setImporting(false);
    }
  }

  return (
    <div className="p-3 sm:p-4 lg:p-8 max-w-7xl mx-auto space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="bg-primary-light/10 text-primary-light p-2 sm:p-3 rounded-xl"><ArrowRightLeft className="w-5 h-5 sm:w-6 sm:h-6" /></div>
          <div>
            <h1 className="text-lg sm:text-2xl font-bold text-foreground">{t("tx.title")}</h1>
            <p className="text-muted text-xs sm:text-sm">{txs.length} {t("transactions").toLowerCase()}</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 sm:gap-2">
          <button onClick={() => setShowCategoryManager(true)} className="p-2.5 sm:px-4 sm:py-2.5 border border-border text-muted rounded-xl hover:text-primary-light transition-colors text-sm" title={t("tx.category")}>
            <Settings2 className="w-5 h-5 sm:w-4 sm:h-4" /><span className="hidden sm:inline ml-1">{t("tx.category")}</span>
          </button>
          <button onClick={() => setShowImport(true)} className="p-2.5 sm:px-4 sm:py-2.5 border border-border text-muted rounded-xl hover:text-accent transition-colors text-sm" title="Import">
            <Upload className="w-5 h-5 sm:w-4 sm:h-4" /><span className="hidden sm:inline ml-1">Import</span>
          </button>
          <button onClick={() => setShowAddModal(true)} className="flex items-center gap-1 bg-primary text-white px-3 py-2 sm:px-5 sm:py-2.5 rounded-xl hover:bg-primary-light transition-colors text-sm font-medium">
            <Plus className="w-4 h-4" /><span className="hidden sm:inline">{t("tx.add")}</span>
          </button>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4">
        <div className="bg-card rounded-2xl border border-border p-4 flex items-center gap-3 overflow-hidden">
          <div className="bg-accent/10 p-2.5 rounded-xl shrink-0"><ArrowUpRight className="w-5 h-5 text-accent" /></div>
          <div className="min-w-0"><p className="text-muted text-xs">{t("tx.totalIncome")}</p><p className="text-base sm:text-lg font-bold text-accent truncate">{formatVND(totalIncome)}</p></div>
        </div>
        <div className="bg-card rounded-2xl border border-border p-4 flex items-center gap-3 overflow-hidden">
          <div className="bg-danger/10 p-2.5 rounded-xl shrink-0"><ArrowDownRight className="w-5 h-5 text-danger" /></div>
          <div className="min-w-0"><p className="text-muted text-xs">{t("tx.totalExpense")}</p><p className="text-base sm:text-lg font-bold text-danger truncate">{formatVND(totalExpense)}</p></div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-card rounded-2xl border border-border p-3 sm:p-4 space-y-3">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
          <input type="text" placeholder={t("tx.search")} value={search} onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 sm:py-2.5 bg-muted-bg border border-border rounded-xl text-sm text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary-light/30" />
        </div>

        {/* Type + category + payer filters */}
        <div className="flex gap-2 overflow-x-auto">
          <select value={filterType} onChange={(e) => setFilterType(e.target.value)}
            className="bg-muted-bg border border-border rounded-xl px-2 sm:px-3 py-2 text-xs sm:text-sm text-foreground focus:outline-none shrink-0">
            <option value="all">{t("tx.all")}</option><option value="income">{t("tx.income")}</option><option value="expense">{t("tx.expense")}</option>
          </select>
          <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)}
            className="bg-muted-bg border border-border rounded-xl px-2 sm:px-3 py-2 text-xs sm:text-sm text-foreground focus:outline-none shrink-0">
            <option value="all">{t("tx.allCategories")}</option>
            {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <select value={filterPayer} onChange={(e) => setFilterPayer(e.target.value)}
            className="bg-muted-bg border border-border rounded-xl px-2 sm:px-3 py-2 text-xs sm:text-sm text-foreground focus:outline-none shrink-0">
            <option value="all">Tất cả người</option>
            {payerList.map((p) => <option key={p.name} value={p.name}>{p.name}</option>)}
            <option value="_empty">Chưa gán</option>
          </select>
        </div>

        {/* Date filter */}
        <div className="flex items-center gap-2 flex-wrap">
          <CalendarDays className="w-4 h-4 text-muted shrink-0" />
          <div className="flex gap-1 bg-muted-bg rounded-xl p-1">
            {(["all", "day", "month", "year"] as DateFilter[]).map((mode) => (
              <button key={mode} onClick={() => handleDateFilterChange(mode)}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                  dateFilter === mode ? "bg-card text-card-foreground shadow-sm" : "text-muted hover:text-card-foreground"
                }`}>
                {mode === "all" ? t("savings.all") : mode === "day" ? t("date.day") : mode === "month" ? t("date.month") : t("date.year")}
              </button>
            ))}
          </div>

          {dateFilter === "day" && (
            <input type="date" value={dateValue} onChange={(e) => setDateValue(e.target.value)}
              className="px-3 py-1.5 bg-muted-bg border border-border rounded-xl text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary-light/30" />
          )}
          {dateFilter === "month" && (
            <input type="month" value={dateValue} onChange={(e) => setDateValue(e.target.value)}
              className="px-3 py-1.5 bg-muted-bg border border-border rounded-xl text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary-light/30" />
          )}
          {dateFilter === "year" && (
            <select value={dateValue} onChange={(e) => setDateValue(e.target.value)}
              className="px-3 py-1.5 bg-muted-bg border border-border rounded-xl text-sm text-foreground focus:outline-none">
              {Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - i).map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          )}

          {dateFilter !== "all" && (
            <button onClick={() => { setDateFilter("all"); setDateValue(""); }}
              className="p-1.5 text-muted hover:text-danger rounded-lg transition-colors">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Selection bar */}
      {txs.length > 0 && (
        <div className="flex items-center justify-between bg-card rounded-2xl border border-border px-4 py-2.5">
          <div className="flex items-center gap-3">
            <input type="checkbox"
              checked={txs.length > 0 && selected.size === txs.length}
              onChange={(e) => {
                if (e.target.checked) setSelected(new Set(txs.map((tx) => tx.id)));
                else setSelected(new Set());
              }}
              className="w-4 h-4 rounded border-border accent-primary-light cursor-pointer" />
            <span className="text-sm text-muted">
              {selected.size > 0 ? `Đã chọn ${selected.size} giao dịch` : "Chọn tất cả"}
            </span>
          </div>
          {selected.size > 0 && !confirmBatchDelete && (
            <button onClick={() => setConfirmBatchDelete(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-danger border border-danger/30 rounded-xl hover:bg-danger/10 transition-colors">
              <Trash2 className="w-3.5 h-3.5" /> Xóa {selected.size}
            </button>
          )}
          {confirmBatchDelete && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-danger">Xóa {selected.size} giao dịch?</span>
              <button onClick={async () => {
                try {
                  const token = getToken();
                  const res = await fetch("/api/transactions/batch-delete", {
                    method: "POST",
                    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                    body: JSON.stringify({ ids: Array.from(selected) }),
                  });
                  if (!res.ok) throw new Error("Xóa thất bại");
                  const count = selected.size;
                  setSelected(new Set()); setConfirmBatchDelete(false);
                  await qc.invalidateQueries({ queryKey: ["transactions"] });
                  qc.invalidateQueries({ queryKey: ["budgets"] });
                  const remaining = pagination.total - count;
                  const maxPage = Math.max(1, Math.ceil(remaining / 50));
                  if (page > maxPage) setPage(maxPage);
                  toast.success(`Đã xóa ${count} giao dịch`);
                } catch (e) {
                  toast.error(e instanceof Error ? e.message : "Lỗi khi xóa");
                }
              }} className="px-3 py-1.5 text-sm font-medium text-white bg-danger rounded-xl hover:bg-danger/90 transition-colors">Xóa</button>
              <button onClick={() => setConfirmBatchDelete(false)} className="px-3 py-1.5 text-sm text-muted">Hủy</button>
            </div>
          )}
        </div>
      )}

      {/* Transaction list */}
      <div className="bg-card rounded-2xl border border-border overflow-hidden">
        {/* Table header — desktop only */}
        <div className="hidden sm:flex items-center gap-3 px-4 py-2.5 border-b border-border text-xs font-medium text-muted bg-muted-bg/50">
          <div className="w-4" />
          <div className="w-10" />
          <div className="flex-1">Danh mục</div>
          <div className="w-20 text-center">Người</div>
          <div className="w-16 text-center">Thanh toán</div>
          <div className="w-24 text-center">Ngày</div>
          <div className="w-28 text-right">Số tiền</div>
          <div className="w-16" />
        </div>

        {isLoading ? (
          <ListSkeleton rows={6} />
        ) : txs.length === 0 ? (
          <div className="p-12 text-center text-muted">{t("tx.empty")}</div>
        ) : txs.map((tx) => {
          const Icon = getIcon(tx.category.icon);
          const color = tx.category.color;
          const isIncome = tx.type === "income";
          const editData = { id: tx.id, type: tx.type, categoryId: tx.categoryId, amount: tx.amount, note: tx.note, payer: tx.payer, paymentMethod: tx.paymentMethod, date: tx.date };
          return (
            <div key={tx.id} className={`border-b border-border last:border-0 px-3 sm:px-4 py-2.5 sm:py-3 group transition-all duration-150 ${selected.has(tx.id) ? "bg-primary-light/5" : "hover:bg-muted-bg/60"}`}>
              {/* Desktop row */}
              <div className="hidden sm:flex items-center gap-3">
                <input type="checkbox" checked={selected.has(tx.id)}
                  onChange={(e) => { const next = new Set(selected); if (e.target.checked) next.add(tx.id); else next.delete(tx.id); setSelected(next); }}
                  className="w-4 h-4 rounded border-border accent-primary-light cursor-pointer shrink-0" />
                <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border" style={{ backgroundColor: `${color}10`, borderColor: `${color}30` }}>
                  <Icon className="w-5 h-5" style={{ color }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-card-foreground truncate">{tx.category.name}</p>
                  {tx.note && <p className="text-xs text-muted truncate">{tx.note}</p>}
                </div>
                <div className="w-20 text-center">
                  <button onClick={() => setEditTx(editData)}
                    className="px-2 py-0.5 text-xs font-semibold rounded-md"
                    style={{ backgroundColor: `${payerColors[tx.payer] || "#94a3b8"}15`, color: payerColors[tx.payer] || "#94a3b8" }}>
                    {tx.payer || "—"}
                  </button>
                </div>
                <div className="w-16 text-center text-xs text-muted">
                  <span className="bg-muted-bg px-2 py-1 rounded-md">
                    {tx.paymentMethod === "bank" ? "🏦 CK" : tx.paymentMethod === "card" ? "💳 Thẻ" : "💵 TM"}
                  </span>
                </div>
                <div className="w-24 text-center text-xs text-muted">
                  {formatDateVN(tx.date)}
                </div>
                <div className="w-28 text-right">
                  <span className={`text-sm font-bold tabular-nums ${isIncome ? "text-accent" : "text-danger"}`}>
                    {isIncome ? "+" : "-"}{formatVND(tx.amount)}
                  </span>
                </div>
                <div className="w-16 flex items-center justify-end gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => setEditTx(editData)} className="p-1.5 text-muted hover:text-primary-light hover:bg-primary-light/10 rounded-lg transition-colors">
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button onClick={() => deleteTx.mutate(tx.id)} className="p-1.5 text-muted hover:text-danger hover:bg-danger/10 rounded-lg transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Mobile row */}
              <div className="sm:hidden" onClick={() => setEditTx(editData)}>
                <div className="flex items-center gap-2">
                  <input type="checkbox" checked={selected.has(tx.id)}
                    onChange={(e) => { e.stopPropagation(); const next = new Set(selected); if (e.target.checked) next.add(tx.id); else next.delete(tx.id); setSelected(next); }}
                    onClick={(e) => e.stopPropagation()}
                    className="w-4 h-4 rounded border-border accent-primary-light cursor-pointer shrink-0" />
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border" style={{ backgroundColor: `${color}10`, borderColor: `${color}30` }}>
                    <Icon className="w-4 h-4" style={{ color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-card-foreground truncate">{tx.category.name}</p>
                    {tx.note && <p className="text-[11px] text-muted truncate mt-0.5">{tx.note}</p>}
                  </div>
                  <span className={`text-sm font-bold tabular-nums shrink-0 ${isIncome ? "text-accent" : "text-danger"}`}>
                    {isIncome ? "+" : "-"}{formatVND(tx.amount)}
                  </span>
                </div>
                <div className="flex items-center gap-2 mt-1.5 ml-[4.5rem]">
                  <span className="px-2 py-0.5 text-[10px] font-semibold rounded-md"
                    style={{ backgroundColor: `${payerColors[tx.payer] || "#94a3b8"}15`, color: payerColors[tx.payer] || "#94a3b8" }}>
                    {tx.payer || "—"}
                  </span>
                  <span className="px-2 py-0.5 text-[10px] font-medium rounded-md bg-muted-bg text-muted">
                    {tx.paymentMethod === "bank" ? "🏦 CK" : tx.paymentMethod === "card" ? "💳 Thẻ" : "💵 TM"}
                  </span>
                  <span className="text-[10px] text-muted ml-auto">
                    {formatDateShort(tx.date)}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between bg-card rounded-2xl border border-border px-4 py-3">
          <p className="text-sm text-muted">
            {pagination.total} giao dịch · Trang {pagination.page}/{pagination.totalPages}
          </p>
          <div className="flex items-center gap-2">
            <button onClick={() => setPage(Math.max(1, page - 1))} disabled={page <= 1}
              className="px-3 py-1.5 text-sm border border-border rounded-lg text-muted hover:text-card-foreground disabled:opacity-30 transition-colors">
              ← Trước
            </button>
            {Array.from({ length: Math.min(pagination.totalPages, 5) }, (_, i) => {
              const p = i + 1;
              return (
                <button key={p} onClick={() => setPage(p)}
                  className={`w-8 h-8 text-sm rounded-lg transition-colors ${page === p ? "bg-primary text-white" : "text-muted hover:bg-muted-bg"}`}>
                  {p}
                </button>
              );
            })}
            <button onClick={() => setPage(Math.min(pagination.totalPages, page + 1))} disabled={page >= pagination.totalPages}
              className="px-3 py-1.5 text-sm border border-border rounded-lg text-muted hover:text-card-foreground disabled:opacity-30 transition-colors">
              Sau →
            </button>
          </div>
        </div>
      )}

      <AddTransactionModal open={showAddModal} onClose={() => setShowAddModal(false)} />
      <EditTransactionModal open={!!editTx} onClose={() => setEditTx(null)} data={editTx} />
      <CategoryManager open={showCategoryManager} onClose={() => setShowCategoryManager(false)} />

      {/* Import Modal */}
      {showImport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => { setShowImport(false); setImportResult(null); }} />
          <div className="relative bg-card rounded-2xl border border-border shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between p-5 border-b border-border">
              <h2 className="text-lg font-semibold text-card-foreground flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-accent" />
                Import từ Excel
              </h2>
              <button onClick={() => { setShowImport(false); setImportResult(null); }} className="p-1 hover:bg-muted-bg rounded-lg"><X className="w-5 h-5 text-muted" /></button>
            </div>

            <div className="p-5 space-y-4">
              {!importResult ? (
                <>
                  {/* Template download + format guide */}
                  <div className="bg-muted-bg rounded-xl p-4 text-xs space-y-3">
                    <div className="flex items-center justify-between">
                      <p className="font-semibold text-card-foreground">Tải file mẫu Excel để điền:</p>
                      <a href="/api/import/template" download
                        className="flex items-center gap-1 px-3 py-1.5 bg-accent text-white rounded-lg text-xs font-medium hover:bg-accent-light transition-colors">
                        <FileSpreadsheet className="w-3 h-3" /> Tải file mẫu
                      </a>
                    </div>
                    <p className="text-muted">Danh mục mới sẽ tự tạo. Tên cột linh hoạt.</p>
                  </div>

                  {/* Amount unit selector */}
                  <div>
                    <p className="text-xs font-medium text-card-foreground mb-2">Đơn vị số tiền trong file:</p>
                    <div className="flex gap-2">
                      <button type="button" onClick={() => setAmountUnit("k")}
                        className={`flex-1 py-2 rounded-xl border text-xs font-medium transition-colors ${amountUnit === "k" ? "border-primary-light bg-primary-light/10 text-primary-light" : "border-border text-muted"}`}>
                        Nghìn đồng (k)<br/><span className="text-muted font-normal">127 = 127.000₫</span>
                      </button>
                      <button type="button" onClick={() => setAmountUnit("dong")}
                        className={`flex-1 py-2 rounded-xl border text-xs font-medium transition-colors ${amountUnit === "dong" ? "border-primary-light bg-primary-light/10 text-primary-light" : "border-border text-muted"}`}>
                        Đồng (VND)<br/><span className="text-muted font-normal">127000 = 127.000₫</span>
                      </button>
                    </div>
                  </div>

                  {/* Upload area */}
                  <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv" className="hidden"
                    onChange={(e) => { const f = e.target.files?.[0]; if (f) handleImport(f); }} />

                  <button
                    onClick={() => fileRef.current?.click()}
                    disabled={importing}
                    className="w-full py-8 border-2 border-dashed border-border rounded-2xl hover:border-accent/50 transition-colors flex flex-col items-center gap-3 disabled:opacity-50"
                  >
                    {importing ? (
                      <>
                        <div className="w-8 h-8 border-3 border-accent border-t-transparent rounded-full animate-spin" />
                        <p className="text-sm text-muted">Đang import...</p>
                      </>
                    ) : (
                      <>
                        <Upload className="w-8 h-8 text-muted" />
                        <div className="text-center">
                          <p className="text-sm font-medium text-card-foreground">Click để chọn file</p>
                          <p className="text-xs text-muted mt-1">.xlsx, .xls, .csv</p>
                        </div>
                      </>
                    )}
                  </button>
                </>
              ) : (
                /* Import result */
                <div className="space-y-4">
                  <div className="flex items-center gap-3 p-4 bg-accent/10 rounded-xl">
                    <CheckCircle2 className="w-8 h-8 text-accent shrink-0" />
                    <div>
                      <p className="text-sm font-semibold text-card-foreground">Import hoàn tất!</p>
                      <p className="text-xs text-muted mt-0.5">{importResult.total} dòng xử lý</p>
                    </div>
                  </div>

                  <div className={`grid gap-3 ${importResult.categoriesCreated ? "grid-cols-3" : "grid-cols-2"}`}>
                    <div className="bg-accent/5 rounded-xl p-3 text-center">
                      <p className="text-2xl font-bold text-accent">{importResult.imported}</p>
                      <p className="text-xs text-muted">Thành công</p>
                    </div>
                    <button onClick={() => setShowImportDetails(showImportDetails === "skipped" ? null : "skipped")}
                      className="bg-warning/5 rounded-xl p-3 text-center hover:bg-warning/10 transition-colors">
                      <p className="text-2xl font-bold text-warning">{importResult.skipped}</p>
                      <p className="text-xs text-muted">Bỏ qua {importResult.skipped > 0 && "▾"}</p>
                    </button>
                    {importResult.categoriesCreated ? (
                      <button onClick={() => setShowImportDetails(showImportDetails === "categories" ? null : "categories")}
                        className="bg-primary-light/5 rounded-xl p-3 text-center hover:bg-primary-light/10 transition-colors">
                        <p className="text-2xl font-bold text-primary-light">{importResult.categoriesCreated}</p>
                        <p className="text-xs text-muted">Danh mục mới ▾</p>
                      </button>
                    ) : null}
                  </div>

                  {/* Detail: skipped */}
                  {showImportDetails === "skipped" && importResult.errors.length > 0 && (
                    <div className="bg-warning/5 rounded-xl p-3 space-y-1">
                      <p className="text-xs font-medium text-warning flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> Dòng bị bỏ qua:</p>
                      {importResult.errors.map((err, i) => (
                        <p key={i} className="text-xs text-muted">{err}</p>
                      ))}
                    </div>
                  )}

                  {/* Detail: new categories */}
                  {showImportDetails === "categories" && importResult.newCategories && (
                    <div className="bg-primary-light/5 rounded-xl p-3 space-y-1">
                      <p className="text-xs font-medium text-primary-light">Danh mục được tạo mới:</p>
                      <div className="flex flex-wrap gap-1.5 mt-1">
                        {importResult.newCategories.map((name, i) => (
                          <span key={i} className="px-2 py-1 bg-primary-light/10 text-primary-light text-xs font-medium rounded-lg">{name}</span>
                        ))}
                      </div>
                    </div>
                  )}



                  <button onClick={() => { setShowImport(false); setImportResult(null); }}
                    className="w-full py-2.5 bg-primary text-white text-sm font-medium rounded-xl hover:bg-primary-light transition-colors">
                    Đóng
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
