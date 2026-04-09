"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Mail, Lock, User, Eye, EyeOff, ShieldCheck, ArrowLeft } from "lucide-react";
import VaultLogo from "@/components/VaultLogo";
import { useAuth } from "@/lib/auth-store";
import { useT } from "@/lib/i18n";

export default function RegisterPage() {
  const { } = useAuth();
  const t = useT();
  const router = useRouter();

  // Step 1: form data
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [showPass, setShowPass] = useState(false);

  // Step 2: OTP
  const [step, setStep] = useState<1 | 2>(1);
  const [otp, setOtp] = useState("");

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Step 1: Send OTP
  async function handleSendOtp(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, name, password, inviteCode }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setStep(2);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Lỗi");
    } finally {
      setLoading(false);
    }
  }

  // Step 2: Verify OTP & create account
  async function handleVerifyOtp(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code: otp }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      // Save token and redirect
      localStorage.setItem("token", data.token);
      window.location.href = "/";
    } catch (err) {
      setError(err instanceof Error ? err.message : "Lỗi");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 py-8">
      <div className="w-full max-w-sm mx-auto">
        {/* Logo */}
        <div className="flex flex-col items-center mb-10">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-10 h-10 bg-sidebar rounded-xl flex items-center justify-center shadow-lg">
              <VaultLogo size={28} className="text-warning" />
            </div>
            <h1 className="text-3xl font-extrabold text-foreground tracking-tight">Vault</h1>
          </div>
          <p className="text-muted text-sm">{step === 1 ? t("auth.registerTitle") : "Xác thực email"}</p>
        </div>

        {step === 1 ? (
          /* Step 1: Registration form */
          <form onSubmit={handleSendOtp} className="bg-card rounded-2xl border border-border p-6 space-y-4 shadow-lg">
            <div>
              <label className="text-sm font-medium text-card-foreground mb-1.5 block">{t("auth.name")}</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
                <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Nguyễn Văn A" required
                  className="w-full pl-10 pr-4 py-3 bg-muted-bg border border-border rounded-xl text-sm text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary-light/30" />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-card-foreground mb-1.5 block">{t("auth.email")}</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="email@example.com" required
                  className="w-full pl-10 pr-4 py-3 bg-muted-bg border border-border rounded-xl text-sm text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary-light/30" />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-card-foreground mb-1.5 block">{t("auth.password")}</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
                <input type={showPass ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)}
                  placeholder={t("auth.minPassword")} required minLength={6}
                  className="w-full pl-10 pr-12 py-3 bg-muted-bg border border-border rounded-xl text-sm text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary-light/30" />
                <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-card-foreground p-1">
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-card-foreground mb-1.5 block">Mã mời</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
                <input type="text" value={inviteCode} onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                  placeholder="Nhập mã mời" required
                  className="w-full pl-10 pr-4 py-3 bg-muted-bg border border-border rounded-xl text-sm text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary-light/30 uppercase tracking-widest" />
              </div>
            </div>

            {error && <p className="text-sm text-danger bg-danger/10 px-4 py-2.5 rounded-xl">{error}</p>}

            <button type="submit" disabled={loading}
              className="w-full py-3 bg-primary text-white rounded-xl text-sm font-semibold hover:bg-primary-light transition-colors disabled:opacity-50">
              {loading ? "Đang gửi mã..." : "Tiếp tục"}
            </button>

            <p className="text-center text-sm text-muted">
              {t("auth.hasAccount")}{" "}
              <Link href="/login" className="text-primary-light hover:underline font-medium">{t("auth.login")}</Link>
            </p>
          </form>
        ) : (
          /* Step 2: OTP verification */
          <form onSubmit={handleVerifyOtp} className="bg-card rounded-2xl border border-border p-6 space-y-5 shadow-lg">
            <div className="text-center">
              <div className="w-14 h-14 bg-accent/10 rounded-2xl flex items-center justify-center mx-auto mb-3">
                <ShieldCheck className="w-7 h-7 text-accent" />
              </div>
              <p className="text-sm text-muted">
                Mã xác thực đã gửi đến <strong className="text-card-foreground">{email}</strong>
              </p>
            </div>

            <div>
              <label className="text-sm font-medium text-card-foreground mb-1.5 block">Mã xác thực (6 số)</label>
              <input
                type="text"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                placeholder="000000"
                required
                maxLength={6}
                autoFocus
                className="w-full py-4 text-center text-2xl font-bold tracking-[0.5em] bg-muted-bg border border-border rounded-xl text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent/30 font-mono"
              />
            </div>

            {error && <p className="text-sm text-danger bg-danger/10 px-4 py-2.5 rounded-xl">{error}</p>}

            <button type="submit" disabled={loading || otp.length !== 6}
              className="w-full py-3 bg-accent text-white rounded-xl text-sm font-semibold hover:bg-accent-light transition-colors disabled:opacity-50">
              {loading ? "Đang xác thực..." : "Xác thực & Tạo tài khoản"}
            </button>

            <div className="flex items-center justify-between text-sm">
              <button type="button" onClick={() => { setStep(1); setError(""); setOtp(""); }}
                className="flex items-center gap-1 text-muted hover:text-primary-light">
                <ArrowLeft className="w-4 h-4" />Quay lại
              </button>
              <button type="button" onClick={() => handleSendOtp({ preventDefault: () => {} } as React.FormEvent)}
                className="text-primary-light hover:underline" disabled={loading}>
                Gửi lại mã
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
