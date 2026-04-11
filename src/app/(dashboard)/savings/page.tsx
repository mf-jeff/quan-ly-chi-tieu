"use client";

import { useState } from "react";
import {
  PiggyBank, Plus, Trash2, X, Landmark, BookOpen, CircleDollarSign,
  TrendingUp, TrendingDown, Clock, AlertTriangle, CheckCircle2, Wallet,
  Settings2, ChevronDown, ChevronUp, Pencil,
} from "lucide-react";
import { useSavings, useAddSavingsItem, useUpdateSavingsItem, useDeleteSavingsItem, useAssetTypes, useAddAssetType, useDeleteAssetType } from "@/lib/hooks";
import LoansSection from "@/components/dashboard/LoansSection";
import { getIcon, availableIcons } from "@/lib/icon-map";
import { formatVND, formatDateVN } from "@/lib/utils";
import { useT } from "@/lib/i18n";
import type { SavingsItemData } from "@/lib/api";

function calcInterest(item: SavingsItemData) {
  if (!item.interestRate || !item.startDate || !item.maturityDate) return 0;
  const days = (new Date(item.maturityDate).getTime() - new Date(item.startDate).getTime()) / (1000 * 60 * 60 * 24);
  return (item.amount * item.interestRate * days) / (365 * 100);
}

function daysUntilMaturity(item: SavingsItemData) {
  if (!item.maturityDate) return null;
  return Math.ceil((new Date(item.maturityDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
}

export default function SavingsPage() {
  const t = useT();
  const { data: atData } = useAssetTypes();
  const addTypeApi = useAddAssetType();
  const deleteTypeApi = useDeleteAssetType();
  const assetTypes = atData?.types || [];
  const getType = (key: string) => assetTypes.find((at) => at.typeKey === key);
  const { data, isLoading } = useSavings();
  const addItem = useAddSavingsItem();
  const updateItem = useUpdateSavingsItem();
  const deleteItem = useDeleteSavingsItem();

  const items = data?.data || [];
  const summary = data?.summary || { totalAssets: 0, totalInterest: 0, totalItems: 0 };
  const goldSummary = data?.goldSummary || { totalUnit: 0, totalBuy: 0, totalCurrent: 0, profitLoss: null };

  // UI state
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [addingTo, setAddingTo] = useState<string | null>(null);
  const [editingItem, setEditingItem] = useState<string | null>(null);
  const [showTypeManager, setShowTypeManager] = useState(false);

  // Add form state
  const [formName, setFormName] = useState("");
  const [formAmount, setFormAmount] = useState("");
  const [formRate, setFormRate] = useState("");
  const [formStartDate, setFormStartDate] = useState("");
  const [formMaturityDate, setFormMaturityDate] = useState("");
  const [formTermMonths, setFormTermMonths] = useState("");
  const [formGoldUnit, setFormGoldUnit] = useState("");
  const [formGoldType, setFormGoldType] = useState("");
  const [formBuyPrice, setFormBuyPrice] = useState("");
  const [formNote, setFormNote] = useState("");

  // Type manager
  const [newTypeName, setNewTypeName] = useState("");
  const [newTypeIcon, setNewTypeIcon] = useState("Tag");
  const [newTypeColor, setNewTypeColor] = useState("#8b5cf6");
  const presetColors = ["#ef4444", "#f97316", "#f59e0b", "#22c55e", "#10b981", "#06b6d4", "#3b82f6", "#6366f1", "#8b5cf6", "#ec4899"];

  function resetForm() {
    setFormName(""); setFormAmount(""); setFormRate(""); setFormStartDate("");
    setFormMaturityDate(""); setFormTermMonths(""); setFormGoldUnit("");
    setFormGoldType(""); setFormBuyPrice(""); setFormNote("");
  }

  function openAdd(typeId: string) { resetForm(); setAddingTo(typeId); setEditingItem(null); }

  function openEdit(item: SavingsItemData) {
    setEditingItem(item.id);
    setAddingTo(item.type);
    setFormName(item.name);
    setFormAmount(item.amount.toString());
    setFormRate(item.interestRate?.toString() || "");
    setFormStartDate(item.startDate ? item.startDate.slice(0, 10) : "");
    setFormMaturityDate(item.maturityDate ? item.maturityDate.slice(0, 10) : "");
    setFormTermMonths(item.termMonths?.toString() || "");
    setFormGoldUnit(item.goldUnit?.toString() || "");
    setFormGoldType(item.goldType || "");
    setFormBuyPrice(item.buyPrice?.toString() || "");
    setFormNote(item.note || "");
  }

  function handleTermChange(months: string) {
    setFormTermMonths(months);
    if (formStartDate && months) {
      const d = new Date(formStartDate);
      d.setMonth(d.getMonth() + Number(months));
      setFormMaturityDate(d.toISOString().slice(0, 10));
    }
  }

  function handleSubmit(typeId: string) {
    if (!formName.trim()) return;
    const payload: Record<string, unknown> = { type: typeId, name: formName.trim(), note: formNote || null };

    if (typeId === "GOLD") {
      if (!formGoldUnit || !formBuyPrice) return;
      payload.goldUnit = Number(formGoldUnit);
      payload.buyPrice = Number(formBuyPrice);
      payload.goldType = formGoldType || null;
      payload.amount = Number(formGoldUnit) * Number(formBuyPrice);
    } else if (typeId === "SAVINGS_BOOK") {
      if (!formAmount) return;
      payload.amount = Number(formAmount);
      payload.interestRate = formRate ? Number(formRate) : null;
      payload.startDate = formStartDate || null;
      payload.maturityDate = formMaturityDate || null;
      payload.termMonths = formTermMonths ? Number(formTermMonths) : null;
    } else {
      if (!formAmount) return;
      payload.amount = Number(formAmount);
      payload.interestRate = formRate ? Number(formRate) : null;
    }

    if (editingItem) {
      updateItem.mutate({ id: editingItem, data: payload }, { onSuccess: () => { setAddingTo(null); setEditingItem(null); resetForm(); } });
    } else {
      addItem.mutate(payload, { onSuccess: () => { setAddingTo(null); resetForm(); } });
    }
  }

  function toggleExpand(typeId: string) {
    setExpanded((p) => ({ ...p, [typeId]: !p[typeId] }));
  }

  function renderInlineForm(typeId: string) {
    const isEditing = !!editingItem;
    const namePlaceholder = typeId === "CASH" ? "VD: Ví cá nhân, Tiền mặt nhà..." :
      typeId === "GOLD" ? "VD: Vàng SJC, Vàng nhẫn..." :
      typeId === "SAVINGS_BOOK" ? "VD: MB Bank, Vietcombank..." : "Tên...";

    return (
      <div className="mt-3 pt-3 border-t border-border space-y-3">
        <input type="text" value={formName} onChange={(e) => setFormName(e.target.value)}
          placeholder={namePlaceholder}
          className="w-full px-3 py-2 bg-muted-bg border border-border rounded-xl text-sm text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary-light/30" />

        {typeId === "GOLD" ? (
          <>
            <div className="grid grid-cols-2 gap-2">
              <input type="number" step="0.1" value={formGoldUnit} onChange={(e) => setFormGoldUnit(e.target.value)} placeholder={`${t("savings.goldUnit")} (chỉ)`}
                className="px-3 py-2 bg-muted-bg border border-border rounded-xl text-sm text-foreground placeholder:text-muted focus:outline-none" />
              <input type="number" value={formBuyPrice} onChange={(e) => setFormBuyPrice(e.target.value)} placeholder={t("savings.buyPrice")}
                className="px-3 py-2 bg-muted-bg border border-border rounded-xl text-sm text-foreground placeholder:text-muted focus:outline-none" />
            </div>
            {formGoldUnit && Number(formGoldUnit) > 0 && (
              <p className="text-xs text-muted">
                = <span className="font-semibold">{formGoldUnit} chỉ</span>
                {Number(formGoldUnit) >= 10 && <span> ({Math.floor(Number(formGoldUnit) / 10)} cây{Number(formGoldUnit) % 10 > 0 ? ` ${Number(formGoldUnit) % 10} chỉ` : ""})</span>}
              </p>
            )}
          </>
        ) : typeId === "SAVINGS_BOOK" ? (
          <>
            <input type="number" value={formAmount} onChange={(e) => setFormAmount(e.target.value)} placeholder="Tiền gốc"
              className="w-full px-3 py-2.5 bg-muted-bg border border-border rounded-xl text-sm font-semibold text-foreground placeholder:text-muted focus:outline-none" />
            {formAmount && Number(formAmount) > 0 && <p className="text-xs text-muted">{formatVND(Number(formAmount))}</p>}
            <input type="number" step="0.1" value={formRate} onChange={(e) => setFormRate(e.target.value)} placeholder={t("savings.interestRate")}
              className="w-full px-3 py-2 bg-muted-bg border border-border rounded-xl text-sm text-foreground placeholder:text-muted focus:outline-none" />
            <div className="grid grid-cols-2 gap-2">
              <input type="date" value={formStartDate} onChange={(e) => setFormStartDate(e.target.value)}
                className="px-3 py-2 bg-muted-bg border border-border rounded-xl text-sm text-foreground focus:outline-none" />
              <select value={formTermMonths} onChange={(e) => handleTermChange(e.target.value)}
                className="px-3 py-2 bg-muted-bg border border-border rounded-xl text-sm text-foreground focus:outline-none">
                <option value="">{t("savings.termMonths")}</option>
                {[1, 3, 6, 12, 24, 36].map((m) => <option key={m} value={m}>{m} tháng</option>)}
              </select>
            </div>
            {formMaturityDate && <p className="text-xs text-muted"><Clock className="w-3 h-3 inline" /> Đáo hạn: {formMaturityDate}</p>}
            {formAmount && formRate && formStartDate && formMaturityDate && (() => {
              const days = (new Date(formMaturityDate).getTime() - new Date(formStartDate).getTime()) / (1000 * 60 * 60 * 24);
              const interest = (Number(formAmount) * Number(formRate) * days) / (365 * 100);
              return <div className="bg-accent/5 rounded-xl p-2 text-xs flex justify-between"><span className="text-muted">{t("savings.totalReceive")}</span><span className="font-bold text-accent">{formatVND(Math.round(Number(formAmount) + interest))}</span></div>;
            })()}
          </>
        ) : typeId === "CASH" ? (
          <>
            <input type="number" value={formAmount} onChange={(e) => setFormAmount(e.target.value)} placeholder="Số tiền"
              className="w-full px-3 py-2.5 bg-muted-bg border border-border rounded-xl text-sm font-semibold text-foreground placeholder:text-muted focus:outline-none" />
            {formAmount && Number(formAmount) > 0 && <p className="text-xs text-muted">{formatVND(Number(formAmount))}</p>}
          </>
        ) : (
          <>
            <input type="number" value={formAmount} onChange={(e) => setFormAmount(e.target.value)} placeholder={t("savings.amount")}
              className="w-full px-3 py-2.5 bg-muted-bg border border-border rounded-xl text-sm font-semibold text-foreground placeholder:text-muted focus:outline-none" />
            {formAmount && Number(formAmount) > 0 && <p className="text-xs text-muted">{formatVND(Number(formAmount))}</p>}
            <input type="number" step="0.1" value={formRate} onChange={(e) => setFormRate(e.target.value)} placeholder={`${t("savings.interestRate")} (không bắt buộc)`}
              className="w-full px-3 py-2 bg-muted-bg border border-border rounded-xl text-sm text-foreground placeholder:text-muted focus:outline-none" />
          </>
        )}

        <input type="text" value={formNote} onChange={(e) => setFormNote(e.target.value)} placeholder={t("savings.note")}
          className="w-full px-3 py-2 bg-muted-bg border border-border rounded-xl text-sm text-foreground placeholder:text-muted focus:outline-none" />

        <div className="flex gap-2">
          <button onClick={() => handleSubmit(typeId)} disabled={addItem.isPending || updateItem.isPending}
            className="flex-1 py-2 bg-accent text-white text-sm font-medium rounded-xl hover:bg-accent-light transition-colors disabled:opacity-50">
            {isEditing ? "Lưu" : "Thêm"}
          </button>
          <button onClick={() => { setAddingTo(null); setEditingItem(null); resetForm(); }}
            className="px-4 py-2 bg-muted-bg text-muted text-sm rounded-xl hover:text-card-foreground transition-colors">Hủy</button>
        </div>
      </div>
    );
  }

  function renderTypeSection(typeId: string) {
    const at = getType(typeId);
    if (!at) return null;
    const Icon = getIcon(at.icon);
    const typeItems = items.filter((i) => i.type === typeId);
    const isExpanded = expanded[typeId] === true; // default collapsed
    const totalAmount = typeItems.reduce((s, i) => s + i.amount, 0);
    const totalGoldUnit = typeItems.reduce((s, i) => s + (i.goldUnit || 0), 0);
    const totalInterest = typeItems.filter((i) => i.type === "SAVINGS_BOOK").reduce((s, i) => s + calcInterest(i), 0);
    const isGold = typeId === "GOLD";

    return (
      <div key={typeId} className="bg-card rounded-2xl border border-border overflow-hidden">
        {/* Section header */}
        <div className="flex items-center justify-between p-5 cursor-pointer" onClick={() => toggleExpand(typeId)}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${at.color}15` }}>
              <Icon className="w-5 h-5" style={{ color: at.color }} />
            </div>
            <div>
              <p className="text-sm font-semibold text-card-foreground">{at.name}</p>
              <p className="text-xs text-muted">{typeItems.length} mục</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              {isGold ? (
                <div>
                  <p className="text-lg font-bold text-card-foreground">{totalGoldUnit} chỉ</p>
                  {totalGoldUnit >= 10 && <p className="text-xs text-muted">({Math.floor(totalGoldUnit / 10)} cây {totalGoldUnit % 10 > 0 ? `${totalGoldUnit % 10} chỉ` : ""})</p>}
                  {goldSummary.profitLoss !== null && (
                    <p className={`text-xs font-semibold ${goldSummary.profitLoss >= 0 ? "text-accent" : "text-danger"}`}>
                      {goldSummary.profitLoss >= 0 ? "+" : ""}{formatVND(Math.round(goldSummary.profitLoss))}
                    </p>
                  )}
                </div>
              ) : (
                <>
                  <p className="text-lg font-bold text-card-foreground">{formatVND(totalAmount)}</p>
                  {totalInterest > 0 && <p className="text-xs text-accent">+{formatVND(Math.round(totalInterest))} lãi</p>}
                </>
              )}
            </div>
            {isExpanded ? <ChevronUp className="w-4 h-4 text-muted" /> : <ChevronDown className="w-4 h-4 text-muted" />}
          </div>
        </div>

        {/* Expanded content */}
        {isExpanded && (
          <div className="px-5 pb-5 space-y-2">
            {/* Gold summary */}
            {isGold && typeItems.length > 0 && goldSummary.totalUnit > 0 && (
              <div className="border-t border-border pt-3">
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div className="bg-muted-bg rounded-lg p-2.5 text-center">
                    <p className="text-muted">Tổng mua</p>
                    <p className="font-semibold text-card-foreground mt-0.5">{formatVND(goldSummary.totalBuy)}</p>
                  </div>
                  <div className="bg-muted-bg rounded-lg p-2.5 text-center">
                    <p className="text-muted">Giá trị hiện tại</p>
                    <p className="font-semibold text-card-foreground mt-0.5">{goldSummary.totalCurrent > 0 ? formatVND(goldSummary.totalCurrent) : "Chưa cập nhật"}</p>
                  </div>
                  <div className={`rounded-lg p-2.5 text-center ${goldSummary.profitLoss !== null ? (goldSummary.profitLoss >= 0 ? "bg-accent/10" : "bg-danger/10") : "bg-muted-bg"}`}>
                    <p className="text-muted">Tổng lãi/lỗ</p>
                    {goldSummary.profitLoss !== null ? (
                      <p className={`font-bold mt-0.5 ${goldSummary.profitLoss >= 0 ? "text-accent" : "text-danger"}`}>
                        {goldSummary.profitLoss >= 0 ? "+" : ""}{formatVND(Math.round(goldSummary.profitLoss))}
                      </p>
                    ) : (
                      <p className="text-muted mt-0.5">--</p>
                    )}
                  </div>
                </div>
              </div>
            )}
            {typeItems.length > 0 && <div className={`${isGold ? "" : "border-t border-border"} pt-3 space-y-2`}>
              {typeItems.map((item) => {
                const days = daysUntilMaturity(item);
                const interest = calcInterest(item);
                const isMaturingSoon = days !== null && days > 0 && days <= 30;
                const isMatured = days !== null && days <= 0;

                return (
                  <div key={item.id} className={`p-3 rounded-xl border ${isMaturingSoon ? "border-warning/30 bg-warning/5" : isMatured ? "border-accent/30 bg-accent/5" : "border-border"}`}>
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium text-card-foreground">{item.name}</p>
                          {isMaturingSoon && <span className="text-xs bg-warning/10 text-warning px-1.5 py-0.5 rounded">{t("savings.maturing")}</span>}
                          {isMatured && <span className="text-xs bg-accent/10 text-accent px-1.5 py-0.5 rounded">{t("savings.matured")}</span>}
                          {item.goldType && <span className="text-xs text-muted">· {item.goldType}</span>}
                        </div>

                        {/* Sub details inline */}
                        <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1 text-xs text-muted">
                          {item.interestRate && <span>Lãi: {item.interestRate}%/năm</span>}
                          {item.termMonths && <span>{item.termMonths} tháng</span>}
                          {item.buyPrice && item.type === "GOLD" && <span>Giá mua: {formatVND(item.buyPrice)}/chỉ</span>}
                          {days !== null && days > 0 && <span className="flex items-center gap-0.5"><Clock className="w-3 h-3" />{days} {t("savings.daysLeft")}</span>}
                          {interest > 0 && <span className="text-accent">Lãi: +{formatVND(Math.round(interest))}</span>}
                        </div>

                        {/* SAVINGS_BOOK progress */}
                        {item.type === "SAVINGS_BOOK" && item.startDate && item.maturityDate && (
                          <div className="mt-2 h-1.5 bg-muted-bg rounded-full overflow-hidden">
                            {(() => { const total = new Date(item.maturityDate).getTime() - new Date(item.startDate).getTime(); const elapsed = Date.now() - new Date(item.startDate).getTime(); const pct = Math.min(100, Math.max(0, (elapsed / total) * 100)); return <div className="h-full rounded-full bg-accent" style={{ width: `${pct}%` }} />; })()}
                          </div>
                        )}

                        {/* GOLD current price + P/L */}
                        {item.type === "GOLD" && (
                          <div className="mt-2 space-y-1">
                            <div className="flex items-center gap-2">
                              <input type="number" placeholder="Giá hiện tại/chỉ"
                                defaultValue={item.currentPrice || ""}
                                onBlur={(e) => {
                                  const val = Number(e.target.value);
                                  if (val > 0 && val !== item.currentPrice) {
                                    updateItem.mutate({ id: item.id, data: { currentPrice: val } });
                                  }
                                }}
                                onKeyDown={(e) => { if (e.key === "Enter") (e.target as HTMLInputElement).blur(); }}
                                className="px-2 py-1 bg-muted-bg border border-border rounded-lg text-xs w-40 text-foreground placeholder:text-muted focus:outline-none focus:ring-1 focus:ring-warning/30" />
                              {item.currentPrice && <span className="text-xs text-muted">= {formatVND(item.currentPrice)}/chỉ</span>}
                            </div>
                            {item.currentPrice && item.buyPrice && item.goldUnit && (() => {
                              const pl = (item.currentPrice - item.buyPrice) * item.goldUnit;
                              const isProfit = pl >= 0;
                              return (
                                <div className={`flex items-center justify-between px-2 py-1 rounded-lg text-xs ${isProfit ? "bg-accent/10" : "bg-danger/10"}`}>
                                  <span className="text-muted">Lãi/Lỗ</span>
                                  <span className={`font-semibold ${isProfit ? "text-accent" : "text-danger"}`}>
                                    {isProfit ? <TrendingUp className="w-3 h-3 inline mr-0.5" /> : <TrendingDown className="w-3 h-3 inline mr-0.5" />}
                                    {isProfit ? "+" : ""}{formatVND(Math.round(pl))}
                                  </span>
                                </div>
                              );
                            })()}
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-2 ml-3">
                        <span className="text-sm font-bold text-card-foreground whitespace-nowrap">
                          {item.type === "GOLD" && item.goldUnit
                            ? `${item.goldUnit} chỉ${item.goldUnit >= 10 ? ` (${Math.floor(item.goldUnit / 10)} cây)` : ""}`
                            : formatVND(item.amount)}
                        </span>
                        <button onClick={() => openEdit(item)} className="p-1 text-muted hover:text-primary-light rounded-lg transition-colors"><Pencil className="w-3.5 h-3.5" /></button>
                        <button onClick={() => deleteItem.mutate(item.id)} className="p-1 text-muted hover:text-danger rounded-lg transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                      </div>
                    </div>

                    {item.note && <p className="text-xs text-muted mt-1 italic">{item.note}</p>}
                  </div>
                );
              })}
            </div>}

            {/* Inline add/edit form */}
            {addingTo === typeId ? (
              renderInlineForm(typeId)
            ) : (
              <button onClick={() => openAdd(typeId)}
                className="flex items-center gap-2 w-full p-2.5 rounded-xl border border-dashed border-border hover:border-primary-light text-muted hover:text-primary-light transition-colors text-sm">
                <Plus className="w-4 h-4" /> Thêm {at.name.toLowerCase()}
              </button>
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="bg-accent/10 text-accent p-3 rounded-xl"><PiggyBank className="w-6 h-6" /></div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">{t("savings.title")}</h1>
            <p className="text-muted text-sm">{t("savings.subtitle")}</p>
          </div>
        </div>
        <button onClick={() => setShowTypeManager(true)} className="flex items-center gap-2 border border-border text-muted px-4 py-2.5 rounded-xl hover:border-primary-light/50 hover:text-primary-light transition-colors text-sm font-medium w-fit">
          <Settings2 className="w-4 h-4" />Loại tài sản
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-card rounded-2xl border border-border p-5">
          <div className="flex items-center justify-between mb-2"><span className="text-muted text-sm">{t("savings.totalAssets")}</span><Landmark className="w-5 h-5 text-primary-light" /></div>
          <p className="text-2xl font-bold text-card-foreground">{formatVND(summary.totalAssets)}</p>
        </div>
        <div className="bg-card rounded-2xl border border-border p-5">
          <div className="flex items-center justify-between mb-2"><span className="text-muted text-sm">{t("savings.totalInterest")}</span><TrendingUp className="w-5 h-5 text-accent" /></div>
          <p className="text-2xl font-bold text-accent">{formatVND(Math.round(summary.totalInterest))}</p>
        </div>
        <div className="bg-card rounded-2xl border border-border p-5">
          <div className="flex items-center justify-between mb-2"><span className="text-muted text-sm">{t("savings.totalItems")}</span><BookOpen className="w-5 h-5 text-warning" /></div>
          <p className="text-2xl font-bold text-card-foreground">{summary.totalItems}</p>
        </div>
      </div>

      {/* Asset type sections */}
      {isLoading ? (
        <div className="text-center py-12 text-muted">{t("tx.loading")}</div>
      ) : (
        <div className="space-y-4">
          {assetTypes.map((at) => renderTypeSection(at.typeKey))}
        </div>
      )}

      {/* Loans Section */}
      <LoansSection />

      {/* Type Manager Modal */}
      {showTypeManager && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowTypeManager(false)} />
          <div className="relative bg-card rounded-2xl border border-border shadow-2xl w-full max-w-md max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b border-border">
              <h2 className="text-lg font-semibold text-card-foreground">Quản lý loại tài sản</h2>
              <button onClick={() => setShowTypeManager(false)} className="p-1 hover:bg-muted-bg rounded-lg"><X className="w-5 h-5 text-muted" /></button>
            </div>
            <div className="p-5 space-y-3">
              {assetTypes.map((at) => {
                const AtIcon = getIcon(at.icon);
                return (
                  <div key={at.id} className="flex items-center gap-3 p-3 rounded-xl border border-border">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${at.color}15` }}>
                      <AtIcon className="w-5 h-5" style={{ color: at.color }} />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-card-foreground">{at.name}</p>
                      <p className="text-xs text-muted">{at.isDefault ? "Mặc định" : "Tùy chỉnh"}</p>
                    </div>
                    {!at.isDefault && (
                      <button onClick={() => deleteTypeApi.mutate(at.id)} className="p-2 text-muted hover:text-danger hover:bg-danger/10 rounded-lg transition-colors"><Trash2 className="w-4 h-4" /></button>
                    )}
                  </div>
                );
              })}
              <div className="p-4 rounded-xl border border-dashed border-border space-y-3">
                <p className="text-sm font-medium text-card-foreground">Thêm loại mới</p>
                <input type="text" value={newTypeName} onChange={(e) => setNewTypeName(e.target.value)} placeholder="Tên loại tài sản..."
                  className="w-full px-3 py-2 bg-muted-bg border border-border rounded-xl text-sm text-foreground placeholder:text-muted focus:outline-none" />
                <div className="flex flex-wrap gap-2">
                  {presetColors.map((c) => (
                    <button key={c} onClick={() => setNewTypeColor(c)} className={`w-6 h-6 rounded-full border-2 ${newTypeColor === c ? "border-foreground scale-110" : "border-transparent"}`} style={{ backgroundColor: c }} />
                  ))}
                </div>
                <div className="flex flex-wrap gap-1.5 max-h-20 overflow-y-auto">
                  {availableIcons.slice(0, 20).map((name) => {
                    const Ic = getIcon(name);
                    return (
                      <button key={name} onClick={() => setNewTypeIcon(name)} className={`p-1.5 rounded-lg ${newTypeIcon === name ? "bg-primary-light/20 border border-primary-light" : "hover:bg-muted-bg border border-transparent"}`}>
                        <Ic className="w-4 h-4" style={{ color: newTypeColor }} />
                      </button>
                    );
                  })}
                </div>
                <button onClick={() => { if (!newTypeName.trim()) return; addTypeApi.mutate({ name: newTypeName.trim(), icon: newTypeIcon, color: newTypeColor }); setNewTypeName(""); }}
                  disabled={!newTypeName.trim()} className="w-full py-2 bg-primary text-white text-sm font-medium rounded-xl hover:bg-primary-light transition-colors disabled:opacity-50">Thêm</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
