"use client";

import { useState } from "react";
import {
  Settings,
  Palette,
  Download,
  Trash2,
  Users,
  Plus,
  Pencil,
  Key,
  X as XIcon,
  Moon,
  Sun,
  Globe,
  Wallet,
  LogOut,
  Check,
} from "lucide-react";
import { useTheme } from "@/components/ThemeProvider";
import { useAuth } from "@/lib/auth-store";
import { useSettings, currencies, languages } from "@/lib/settings-store";
import { exportApi, getToken } from "@/lib/api";
import { useUpdateUserSettings, usePayers, useAddPayer, useUpdatePayer, useDeletePayer } from "@/lib/hooks";
import { useT } from "@/lib/i18n";
import { toast } from "sonner";

export default function SettingsPage() {
  const { theme, toggle: toggleTheme } = useTheme();
  const { user, logout } = useAuth();
  const { currency, language, setCurrency, setLanguage } = useSettings();
  const updateSettings = useUpdateUserSettings();
  const t = useT();
  const [showLangPicker, setShowLangPicker] = useState(false);
  const [showCurrencyPicker, setShowCurrencyPicker] = useState(false);
  const { data: payerData } = usePayers();
  const addPayer = useAddPayer();
  const updatePayer = useUpdatePayer();
  const deletePayer = useDeletePayer();
  const payers = payerData?.payers || [];
  const [newPayerName, setNewPayerName] = useState("");
  const [editPayerColor, setEditPayerColor] = useState<string | null>(null);

  const payerColors = ["#3b82f6", "#ef4444", "#10b981", "#f59e0b", "#8b5cf6", "#ec4899", "#06b6d4", "#f97316", "#22c55e", "#6366f1", "#d946ef", "#14b8a6"];

  // Profile edit
  const [editProfile, setEditProfile] = useState(false);
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [profileSaving, setProfileSaving] = useState(false);

  // Change password
  const [showChangePass, setShowChangePass] = useState(false);
  const [currentPass, setCurrentPass] = useState("");
  const [newPass, setNewPass] = useState("");
  const [confirmPass, setConfirmPass] = useState("");
  const [passSaving, setPassSaving] = useState(false);

  const [exportMonth, setExportMonth] = useState(new Date().toISOString().slice(0, 7));

  function openEditProfile() {
    setEditName(user?.name || "");
    setEditEmail(user?.email || "");
    setEditProfile(true);
  }

  async function saveProfile() {
    setProfileSaving(true);
    try {
      const token = getToken();
      const res = await fetch("/api/user/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ name: editName, email: editEmail }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success("Đã cập nhật thông tin");
      setEditProfile(false);
      window.location.reload();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Lỗi");
    } finally {
      setProfileSaving(false);
    }
  }

  async function changePassword() {
    if (newPass !== confirmPass) { toast.error("Mật khẩu xác nhận không khớp"); return; }
    setPassSaving(true);
    try {
      const token = getToken();
      const res = await fetch("/api/user/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ currentPassword: currentPass, newPassword: newPass }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success("Đã đổi mật khẩu");
      setShowChangePass(false);
      setCurrentPass(""); setNewPass(""); setConfirmPass("");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Lỗi");
    } finally {
      setPassSaving(false);
    }
  }

  async function handleExport(format: "xlsx" | "csv") {
    try {
      const [y, m] = exportMonth.split("-").map(Number);
      const startDate = new Date(y, m - 1, 1).toISOString();
      const endDate = new Date(y, m, 0, 23, 59, 59).toISOString();
      await exportApi.download(format, startDate, endDate);
      toast.success(`Đã xuất file ${format.toUpperCase()} thành công`);
    } catch {
      toast.error("Xuất file thất bại");
    }
  }

  return (
    <div className="p-4 lg:p-8 max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="bg-primary-light/10 text-primary-light p-3 rounded-xl"><Settings className="w-6 h-6" /></div>
        <div><h1 className="text-2xl font-bold text-foreground">{t("settings.title")}</h1><p className="text-muted text-sm">{t("settings.subtitle")}</p></div>
      </div>

      {/* Profile card */}
      <div className="bg-card rounded-2xl border border-border p-6 space-y-4">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-primary-light flex items-center justify-center text-white text-2xl font-bold">
            {user?.name?.charAt(0) || "U"}
          </div>
          {editProfile ? (
            <div className="flex-1 space-y-2">
              <input type="text" value={editName} onChange={(e) => setEditName(e.target.value)} placeholder="Họ tên"
                className="w-full px-3 py-2 bg-muted-bg border border-border rounded-xl text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary-light/30" />
              <input type="email" value={editEmail} onChange={(e) => setEditEmail(e.target.value)} placeholder="Email"
                className="w-full px-3 py-2 bg-muted-bg border border-border rounded-xl text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary-light/30" />
              <div className="flex gap-2">
                <button onClick={saveProfile} disabled={profileSaving}
                  className="flex items-center gap-1 px-3 py-1.5 bg-accent text-white text-sm rounded-xl hover:bg-accent-light transition-colors disabled:opacity-50">
                  <Check className="w-3.5 h-3.5" />{profileSaving ? "..." : "Lưu"}
                </button>
                <button onClick={() => setEditProfile(false)}
                  className="flex items-center gap-1 px-3 py-1.5 bg-muted-bg text-muted text-sm rounded-xl hover:text-card-foreground transition-colors">
                  <XIcon className="w-3.5 h-3.5" />Hủy
                </button>
              </div>
            </div>
          ) : (
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-card-foreground">{user?.name || "User"}</h3>
              <p className="text-sm text-muted">{user?.email || ""}</p>
            </div>
          )}
          {!editProfile && (
            <div className="flex items-center gap-2">
              <button onClick={openEditProfile} className="p-2 text-muted hover:text-primary-light hover:bg-primary-light/10 rounded-xl transition-colors" title="Sửa thông tin">
                <Pencil className="w-4 h-4" />
              </button>
              <button onClick={logout} className="flex items-center gap-2 px-4 py-2 text-sm text-danger border border-danger/30 rounded-xl hover:bg-danger/10 transition-colors">
                <LogOut className="w-4 h-4" />{t("settings.logout")}
              </button>
            </div>
          )}
        </div>

        {/* Change password */}
        {showChangePass ? (
          <div className="border-t border-border pt-4 space-y-3">
            <div className="flex items-center gap-2 mb-2">
              <Key className="w-4 h-4 text-primary-light" />
              <span className="text-sm font-semibold text-card-foreground">Đổi mật khẩu</span>
            </div>
            <input type="password" value={currentPass} onChange={(e) => setCurrentPass(e.target.value)} placeholder="Mật khẩu hiện tại"
              className="w-full px-3 py-2.5 bg-muted-bg border border-border rounded-xl text-sm text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary-light/30" />
            <input type="password" value={newPass} onChange={(e) => setNewPass(e.target.value)} placeholder="Mật khẩu mới (tối thiểu 6 ký tự)"
              className="w-full px-3 py-2.5 bg-muted-bg border border-border rounded-xl text-sm text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary-light/30" />
            <input type="password" value={confirmPass} onChange={(e) => setConfirmPass(e.target.value)} placeholder="Xác nhận mật khẩu mới"
              className="w-full px-3 py-2.5 bg-muted-bg border border-border rounded-xl text-sm text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary-light/30" />
            <div className="flex gap-2">
              <button onClick={changePassword} disabled={passSaving || !currentPass || !newPass || !confirmPass}
                className="flex-1 py-2 bg-primary text-white text-sm font-medium rounded-xl hover:bg-primary-light transition-colors disabled:opacity-50">
                {passSaving ? "Đang lưu..." : "Đổi mật khẩu"}
              </button>
              <button onClick={() => { setShowChangePass(false); setCurrentPass(""); setNewPass(""); setConfirmPass(""); }}
                className="px-4 py-2 bg-muted-bg text-muted text-sm rounded-xl hover:text-card-foreground transition-colors">
                Hủy
              </button>
            </div>
          </div>
        ) : (
          <button onClick={() => setShowChangePass(true)}
            className="flex items-center gap-2 w-full border-t border-border pt-4 text-sm text-primary-light hover:text-primary-light/80 transition-colors">
            <Key className="w-4 h-4" />Đổi mật khẩu
          </button>
        )}
      </div>

      {/* Preferences */}
      <div className="bg-card rounded-2xl border border-border p-5">
        <div className="flex items-center gap-2 mb-2">
          <Palette className="w-5 h-5 text-primary-light" />
          <h3 className="text-base font-semibold text-card-foreground">{t("settings.appearance")}</h3>
        </div>

        {/* Dark mode */}
        <div className="flex items-center justify-between py-4 border-b border-border">
          <div className="flex items-center gap-3">
            {theme === "dark" ? <Moon className="w-4 h-4 text-muted" /> : <Sun className="w-4 h-4 text-warning" />}
            <div>
              <p className="text-sm font-medium text-card-foreground">{t("settings.darkMode")}</p>
              <p className="text-xs text-muted">{t("settings.darkModeDesc")}</p>
            </div>
          </div>
          <button onClick={toggleTheme}
            className={`relative w-11 h-6 rounded-full transition-colors ${theme === "dark" ? "bg-accent" : "bg-muted-bg border border-border"}`}
            role="switch" aria-checked={theme === "dark"}>
            <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${theme === "dark" ? "translate-x-[22px]" : "translate-x-0.5"}`} />
          </button>
        </div>

        {/* Language */}
        <div className="py-4 border-b border-border">
          <div className="flex items-center justify-between cursor-pointer" onClick={() => setShowLangPicker(!showLangPicker)}>
            <div className="flex items-center gap-3">
              <Globe className="w-4 h-4 text-muted" />
              <div>
                <p className="text-sm font-medium text-card-foreground">{t("settings.language")}</p>
                <p className="text-xs text-muted">{language.flag} {language.name}</p>
              </div>
            </div>
            <span className="text-xs text-primary-light font-medium">{t("settings.change")}</span>
          </div>
          {showLangPicker && (
            <div className="mt-3 grid grid-cols-1 gap-1.5 bg-muted-bg rounded-xl p-2">
              {languages.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => { setLanguage(lang.code); updateSettings.mutate({ language: lang.code }); setShowLangPicker(false); window.location.reload(); }}
                  className={`flex items-center justify-between px-3 py-2.5 rounded-lg transition-colors ${
                    language.code === lang.code ? "bg-primary-light/10 text-primary-light" : "hover:bg-card text-card-foreground"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-lg">{lang.flag}</span>
                    <span className="text-sm font-medium">{lang.name}</span>
                  </div>
                  {language.code === lang.code && <Check className="w-4 h-4 text-primary-light" />}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Currency */}
        <div className="py-4">
          <div className="flex items-center justify-between cursor-pointer" onClick={() => setShowCurrencyPicker(!showCurrencyPicker)}>
            <div className="flex items-center gap-3">
              <Wallet className="w-4 h-4 text-muted" />
              <div>
                <p className="text-sm font-medium text-card-foreground">{t("settings.currency")}</p>
                <p className="text-xs text-muted">{currency.code} ({currency.symbol}) — {currency.name}</p>
              </div>
            </div>
            <span className="text-xs text-primary-light font-medium">{t("settings.change")}</span>
          </div>
          {showCurrencyPicker && (
            <div className="mt-3 grid grid-cols-1 gap-1.5 bg-muted-bg rounded-xl p-2 max-h-64 overflow-y-auto">
              {currencies.map((cur) => (
                <button
                  key={cur.code}
                  onClick={() => { setCurrency(cur.code); updateSettings.mutate({ currency: cur.code }); setShowCurrencyPicker(false); window.location.reload(); }}
                  className={`flex items-center justify-between px-3 py-2.5 rounded-lg transition-colors ${
                    currency.code === cur.code ? "bg-primary-light/10 text-primary-light" : "hover:bg-card text-card-foreground"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="w-8 h-8 rounded-lg bg-card flex items-center justify-center text-sm font-bold border border-border">
                      {cur.symbol}
                    </span>
                    <div className="text-left">
                      <p className="text-sm font-medium">{cur.code}</p>
                      <p className="text-xs text-muted">{cur.name}</p>
                    </div>
                  </div>
                  {currency.code === cur.code && <Check className="w-4 h-4 text-primary-light" />}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Payer management */}
      <div className="bg-card rounded-2xl border border-border p-5">
        <div className="flex items-center gap-2 mb-3">
          <Users className="w-5 h-5 text-primary-light" />
          <h3 className="text-base font-semibold text-card-foreground">Người</h3>
        </div>
        <div className="space-y-2">
          {payers.map((p) => (
            <div key={p.id} className="rounded-xl border border-border">
              <div className="flex items-center gap-3 py-2.5 px-3">
                <div className="w-7 h-7 rounded-full shrink-0" style={{ backgroundColor: p.color }} />
                <span className="text-sm font-medium text-card-foreground flex-1">{p.name}</span>
                <button onClick={() => setEditPayerColor(editPayerColor === p.id ? null : p.id)}
                  className="p-1.5 text-muted hover:text-primary-light hover:bg-primary-light/10 rounded-lg transition-colors">
                  <Palette className="w-4 h-4" />
                </button>
                <button onClick={() => deletePayer.mutate(p.id)}
                  className="p-1.5 text-muted hover:text-danger hover:bg-danger/10 rounded-lg transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              {editPayerColor === p.id && (
                <div className="px-3 pb-3 flex flex-wrap gap-1.5">
                  {payerColors.map((c) => (
                    <button key={c} onClick={() => { updatePayer.mutate({ id: p.id, data: { color: c } }); setEditPayerColor(null); }}
                      className={`w-6 h-6 rounded-full border-2 transition-transform hover:scale-110 ${p.color === c ? "border-foreground scale-110" : "border-transparent"}`}
                      style={{ backgroundColor: c }} />
                  ))}
                </div>
              )}
            </div>
          ))}
          {payers.length === 0 && <p className="text-xs text-muted py-2">Chưa có người nào</p>}
          <div className="flex gap-2 pt-1">
            <input type="text" value={newPayerName} onChange={(e) => setNewPayerName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && newPayerName.trim()) {
                  addPayer.mutate({ name: newPayerName.trim(), color: payerColors[payers.length % payerColors.length] }); setNewPayerName("");
                }
              }}
              placeholder="Thêm người mới..."
              className="flex-1 px-3 py-2 bg-muted-bg border border-border rounded-xl text-sm text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary-light/30" />
            <button onClick={() => {
              if (newPayerName.trim()) {
                addPayer.mutate({ name: newPayerName.trim(), color: payerColors[payers.length % payerColors.length] }); setNewPayerName("");
              }
            }} className="px-4 py-2 bg-primary text-white text-sm font-medium rounded-xl hover:bg-primary-light transition-colors">
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>


      {/* Export */}
      <div className="bg-card rounded-2xl border border-border p-5">
        <div className="flex items-center gap-2 mb-3">
          <Download className="w-5 h-5 text-primary-light" />
          <h3 className="text-base font-semibold text-card-foreground">{t("settings.export")}</h3>
        </div>
        <div className="flex items-center gap-3 py-3 border-b border-border">
          <span className="text-sm text-card-foreground">Tháng:</span>
          <input type="month" value={exportMonth} onChange={(e) => setExportMonth(e.target.value)}
            className="px-3 py-2 bg-muted-bg border border-border rounded-xl text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary-light/30" />
        </div>
        <div className="flex items-center justify-between py-4 border-b border-border">
          <div><p className="text-sm font-medium text-card-foreground">{t("settings.exportExcel")}</p><p className="text-xs text-muted">{t("settings.exportExcelDesc")}</p></div>
          <button onClick={() => handleExport("xlsx")} className="px-4 py-2 text-sm font-medium text-primary-light border border-primary-light/30 rounded-xl hover:bg-primary-light/10 transition-colors">{t("settings.download")}</button>
        </div>
        <div className="flex items-center justify-between py-4">
          <div><p className="text-sm font-medium text-card-foreground">{t("settings.exportCSV")}</p><p className="text-xs text-muted">{t("settings.exportCSVDesc")}</p></div>
          <button onClick={() => handleExport("csv")} className="px-4 py-2 text-sm font-medium text-primary-light border border-primary-light/30 rounded-xl hover:bg-primary-light/10 transition-colors">{t("settings.download")}</button>
        </div>
      </div>

    </div>
  );
}
