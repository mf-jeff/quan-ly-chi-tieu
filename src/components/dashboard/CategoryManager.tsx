"use client";

import { useState } from "react";
import { X, Plus, Trash2, Palette, Merge } from "lucide-react";
import { useCategories, useAddCategory, useDeleteCategory } from "@/lib/hooks";
import { categoryApi, getToken } from "@/lib/api";
import { useQueryClient } from "@tanstack/react-query";
import { getIcon, availableIcons } from "@/lib/icon-map";
import { useT } from "@/lib/i18n";
import { toast } from "sonner";
import type { TransactionType } from "@/lib/types";

interface Props {
  open: boolean;
  onClose: () => void;
}

const presetColors = [
  "#ef4444", "#dc2626", "#b91c1c",
  "#f97316", "#ea580c", "#c2410c",
  "#f59e0b", "#d97706", "#b45309",
  "#84cc16", "#65a30d", "#4d7c0f",
  "#22c55e", "#16a34a", "#15803d",
  "#10b981", "#059669", "#047857",
  "#14b8a6", "#0d9488", "#0f766e",
  "#06b6d4", "#0891b2", "#0e7490",
  "#3b82f6", "#2563eb", "#1d4ed8",
  "#6366f1", "#4f46e5", "#4338ca",
  "#8b5cf6", "#7c3aed", "#6d28d9",
  "#a855f7", "#9333ea", "#7e22ce",
  "#d946ef", "#c026d3", "#a21caf",
  "#ec4899", "#db2777", "#be185d",
  "#f43f5e", "#e11d48", "#be123c",
  "#78716c", "#57534e", "#44403c",
  "#94a3b8", "#64748b", "#475569",
];

export default function CategoryManager({ open, onClose }: Props) {
  const { data } = useCategories();
  const addCat = useAddCategory();
  const delCat = useDeleteCategory();
  const qc = useQueryClient();
  const t = useT();
  const categories = data?.categories || [];

  const [showAdd, setShowAdd] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editMode, setEditMode] = useState<"color" | "icon" | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: string; name: string; txCount: number } | null>(null);
  const [mergeConfirm, setMergeConfirm] = useState<{ id: string; name: string; txCount: number } | null>(null);
  const [moveToId, setMoveToId] = useState("");
  const [newName, setNewName] = useState("");
  const [newIcon, setNewIcon] = useState("Tag");
  const [newColor, setNewColor] = useState("#3b82f6");
  const [newType, setNewType] = useState<TransactionType | "both">("expense");
  const [error, setError] = useState("");

  function handleAdd() {
    setError("");
    if (!newName.trim()) { setError("Vui lòng nhập tên danh mục"); return; }

    addCat.mutate(
      { name: newName.trim(), icon: newIcon, color: newColor, type: newType },
      {
        onSuccess: () => { setNewName(""); setNewIcon("Tag"); setNewColor("#3b82f6"); setNewType("expense"); setShowAdd(false); },
        onError: (e) => setError(e.message),
      }
    );
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-card rounded-2xl border border-border shadow-2xl w-full max-w-lg max-h-[85vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-border sticky top-0 bg-card rounded-t-2xl z-10">
          <h2 className="text-lg font-semibold text-card-foreground">{t("catMgr.title")}</h2>
          <button onClick={onClose} className="p-1 hover:bg-muted-bg rounded-lg"><X className="w-5 h-5 text-muted" /></button>
        </div>

        <div className="p-5 space-y-3">
          {categories.map((cat) => {
            const CatIcon = getIcon(cat.icon);
            const isEditing = editingId === cat.id;
            return (
              <div key={cat.id} className="rounded-xl border border-border">
                <div className="flex items-center gap-3 p-3">
                  <button
                    onClick={() => { setEditingId(isEditing && editMode === "icon" ? null : cat.id); setEditMode("icon"); }}
                    className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 hover:ring-2 hover:ring-primary-light/30 transition-all cursor-pointer"
                    style={{ backgroundColor: `${cat.color}15` }}
                    title="Đổi icon"
                  >
                    <CatIcon className="w-5 h-5" style={{ color: cat.color }} />
                  </button>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-card-foreground">{cat.name}</p>
                    <p className="text-xs text-muted">
                      {cat.type === "expense" ? t("catMgr.expense") : cat.type === "income" ? t("catMgr.income") : t("catMgr.both")}
                      {cat._count.transactions > 0 && ` · ${cat._count.transactions} ${t("catMgr.txCount")}`}
                    </p>
                  </div>
                  <button onClick={() => { setEditingId(isEditing && editMode === "color" ? null : cat.id); setEditMode("color"); }}
                    className="p-2 text-muted hover:text-primary-light hover:bg-primary-light/10 rounded-lg transition-colors" title="Đổi màu">
                    <Palette className="w-4 h-4" />
                  </button>
                  <button onClick={() => { setMergeConfirm({ id: cat.id, name: cat.name, txCount: cat._count.transactions }); setMoveToId(""); }}
                    className="p-2 text-muted hover:text-warning hover:bg-warning/10 rounded-lg transition-colors" title="Gộp vào danh mục khác">
                    <Merge className="w-4 h-4" />
                  </button>
                  <button onClick={async () => {
                    if (cat._count.transactions > 0) {
                      setDeleteConfirm({ id: cat.id, name: cat.name, txCount: cat._count.transactions });
                      setMoveToId("");
                    } else {
                      delCat.mutate(cat.id);
                    }
                  }}
                    className="p-2 text-muted hover:text-danger hover:bg-danger/10 rounded-lg transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {/* Color picker */}
                {isEditing && editMode === "color" && (
                  <div className="px-3 pb-3">
                    <p className="text-xs text-muted mb-2">Chọn màu:</p>
                    <div className="flex flex-wrap gap-1.5">
                      {presetColors.map((c) => (
                        <button key={c}
                          onClick={async () => {
                            try {
                              await categoryApi.update(cat.id, { color: c });
                              qc.invalidateQueries({ queryKey: ["categories"] });
                              qc.invalidateQueries({ queryKey: ["transactions"] });
                              setEditingId(null);
                              toast.success("Đã đổi màu");
                            } catch { toast.error("Lỗi"); }
                          }}
                          className={`w-6 h-6 rounded-full border-2 transition-transform hover:scale-110 ${cat.color === c ? "border-foreground scale-110" : "border-transparent"}`}
                          style={{ backgroundColor: c }}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Icon picker */}
                {isEditing && editMode === "icon" && (
                  <div className="px-3 pb-3">
                    <p className="text-xs text-muted mb-2">Chọn icon:</p>
                    <div className="flex flex-wrap gap-1.5 max-h-40 overflow-y-auto">
                      {availableIcons.map((name) => {
                        const Ic = getIcon(name);
                        return (
                          <button key={name}
                            onClick={async () => {
                              try {
                                await categoryApi.update(cat.id, { icon: name });
                                qc.invalidateQueries({ queryKey: ["categories"] });
                                qc.invalidateQueries({ queryKey: ["transactions"] });
                                setEditingId(null);
                                toast.success("Đã đổi icon");
                              } catch { toast.error("Lỗi"); }
                            }}
                            className={`p-2 rounded-lg transition-colors ${cat.icon === name ? "bg-primary-light/20 border border-primary-light" : "hover:bg-muted-bg border border-transparent"}`}
                          >
                            <Ic className="w-5 h-5" style={{ color: cat.color }} />
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          {!showAdd ? (
            <button onClick={() => setShowAdd(true)}
              className="flex items-center gap-2 w-full p-3 rounded-xl border border-dashed border-border hover:border-primary-light text-muted hover:text-primary-light transition-colors">
              <Plus className="w-5 h-5" /><span className="text-sm font-medium">{t("catMgr.add")}</span>
            </button>
          ) : (
            <div className="p-4 rounded-xl border border-primary-light/30 bg-primary-light/5 space-y-3">
              <input type="text" value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Tên danh mục..."
                className="w-full px-3 py-2 bg-muted-bg border border-border rounded-xl text-sm text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary-light/30" />
              <div className="flex gap-1.5">
                {([["expense", t("catMgr.expense")], ["income", t("catMgr.income")], ["both", t("catMgr.both")]] as [TransactionType | "both", string][]).map(([val, label]) => (
                  <button key={val} type="button" onClick={() => setNewType(val)}
                    className={`flex-1 py-1.5 text-xs rounded-lg transition-colors ${newType === val ? "bg-primary text-white" : "bg-muted-bg text-muted"}`}>{label}</button>
                ))}
              </div>
              <div className="flex flex-wrap gap-2">
                {presetColors.map((color) => (
                  <button key={color} type="button" onClick={() => setNewColor(color)}
                    className={`w-7 h-7 rounded-full border-2 ${newColor === color ? "border-foreground scale-110" : "border-transparent"}`} style={{ backgroundColor: color }} />
                ))}
              </div>
              <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto">
                {availableIcons.map((name) => {
                  const Ic = getIcon(name);
                  return (
                    <button key={name} type="button" onClick={() => setNewIcon(name)}
                      className={`p-2 rounded-lg ${newIcon === name ? "bg-primary-light/20 border border-primary-light" : "hover:bg-muted-bg border border-transparent"}`}>
                      <Ic className="w-4 h-4" style={{ color: newColor }} />
                    </button>
                  );
                })}
              </div>
              {error && <p className="text-xs text-danger">{error}</p>}
              <div className="flex gap-2">
                <button type="button" onClick={handleAdd} disabled={addCat.isPending}
                  className="flex-1 py-2 bg-primary text-white text-sm font-medium rounded-xl hover:bg-primary-light transition-colors disabled:opacity-50">Thêm</button>
                <button type="button" onClick={() => { setShowAdd(false); setError(""); }}
                  className="px-4 py-2 bg-muted-bg text-muted text-sm rounded-xl">Hủy</button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Move & Delete confirmation dialog */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setDeleteConfirm(null)} />
          <div className="relative bg-card rounded-2xl border border-border shadow-2xl w-full max-w-sm">
            <div className="p-5 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-warning/10 flex items-center justify-center">
                  <Trash2 className="w-5 h-5 text-warning" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-card-foreground">Xóa danh mục &quot;{deleteConfirm.name}&quot;</p>
                  <p className="text-xs text-muted">{deleteConfirm.txCount} giao dịch sẽ được chuyển</p>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-card-foreground mb-2 block">Chuyển giao dịch sang:</label>
                <select value={moveToId} onChange={(e) => setMoveToId(e.target.value)}
                  className="w-full px-3 py-2.5 bg-muted-bg border border-border rounded-xl text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary-light/30">
                  <option value="">-- Chọn danh mục --</option>
                  {categories.filter((c) => c.id !== deleteConfirm.id).map((c) => (
                    <option key={c.id} value={c.id}>{c.name} ({c._count.transactions} giao dịch)</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <div className="flex gap-2">
                  <button
                    onClick={async () => {
                      if (!moveToId) { toast.error("Vui lòng chọn danh mục đích"); return; }
                      try {
                        await categoryApi.delete(deleteConfirm.id, moveToId);
                        qc.invalidateQueries({ queryKey: ["categories"] });
                        qc.invalidateQueries({ queryKey: ["transactions"] });
                        toast.success(`Đã chuyển ${deleteConfirm.txCount} giao dịch và xóa danh mục`);
                        setDeleteConfirm(null);
                      } catch (e) { toast.error(e instanceof Error ? e.message : "Lỗi"); }
                    }}
                    disabled={!moveToId}
                    className="flex-1 py-2.5 bg-primary text-white text-sm font-medium rounded-xl hover:bg-primary-light transition-colors disabled:opacity-50">
                    Chuyển &amp; Xóa
                  </button>
                  <button onClick={() => setDeleteConfirm(null)}
                    className="px-4 py-2.5 bg-muted-bg text-muted text-sm rounded-xl hover:text-card-foreground transition-colors">
                    Hủy
                  </button>
                </div>
                <button
                  onClick={async () => {
                    if (!confirm(`Xóa ${deleteConfirm.txCount} giao dịch và danh mục "${deleteConfirm.name}"? Không thể hoàn tác!`)) return;
                    try {
                      // Delete all transactions first, then category
                      const token = getToken();
                      await fetch(`/api/categories/${deleteConfirm.id}?deleteAll=true`, {
                        method: "DELETE",
                        headers: { Authorization: `Bearer ${token}` },
                      });
                      qc.invalidateQueries({ queryKey: ["categories"] });
                      qc.invalidateQueries({ queryKey: ["transactions"] });
                      toast.success("Đã xóa danh mục và tất cả giao dịch");
                      setDeleteConfirm(null);
                    } catch (e) { toast.error(e instanceof Error ? e.message : "Lỗi"); }
                  }}
                  className="w-full py-2 text-xs text-danger hover:bg-danger/10 rounded-xl transition-colors">
                  Xóa tất cả {deleteConfirm.txCount} giao dịch &amp; xóa danh mục
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Merge confirmation dialog */}
      {mergeConfirm && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setMergeConfirm(null)} />
          <div className="relative bg-card rounded-2xl border border-border shadow-2xl w-full max-w-sm">
            <div className="p-5 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-warning/10 flex items-center justify-center">
                  <Merge className="w-5 h-5 text-warning" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-card-foreground">Gộp &quot;{mergeConfirm.name}&quot;</p>
                  <p className="text-xs text-muted">{mergeConfirm.txCount} giao dịch sẽ được chuyển sang danh mục đích</p>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-card-foreground mb-2 block">Gộp vào danh mục:</label>
                <select value={moveToId} onChange={(e) => setMoveToId(e.target.value)}
                  className="w-full px-3 py-2.5 bg-muted-bg border border-border rounded-xl text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary-light/30">
                  <option value="">-- Chọn danh mục đích --</option>
                  {categories.filter((c) => c.id !== mergeConfirm.id).map((c) => (
                    <option key={c.id} value={c.id}>{c.name} ({c._count.transactions} giao dịch)</option>
                  ))}
                </select>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={async () => {
                    if (!moveToId) { toast.error("Vui lòng chọn danh mục đích"); return; }
                    try {
                      await categoryApi.delete(mergeConfirm.id, moveToId);
                      qc.invalidateQueries({ queryKey: ["categories"] });
                      qc.invalidateQueries({ queryKey: ["transactions"] });
                      toast.success(`Đã gộp ${mergeConfirm.txCount} giao dịch vào danh mục đích`);
                      setMergeConfirm(null);
                    } catch (e) { toast.error(e instanceof Error ? e.message : "Lỗi"); }
                  }}
                  disabled={!moveToId}
                  className="flex-1 py-2.5 bg-warning text-white text-sm font-medium rounded-xl hover:bg-warning/90 transition-colors disabled:opacity-50">
                  Gộp
                </button>
                <button onClick={() => setMergeConfirm(null)}
                  className="px-4 py-2.5 bg-muted-bg text-muted text-sm rounded-xl hover:text-card-foreground transition-colors">
                  Hủy
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
