"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Lock, CheckCircle2, Eye, EyeOff } from "lucide-react";
import VaultLogo from "@/components/VaultLogo";

export default function ResetPasswordPage() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (password !== confirm) { setError("Mật khẩu xác nhận không khớp"); return; }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Lỗi");
    } finally {
      setLoading(false);
    }
  }

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="bg-card rounded-2xl border border-border p-6 text-center space-y-4 max-w-sm">
          <p className="text-danger font-semibold">Link không hợp lệ</p>
          <Link href="/forgot-password" className="text-sm text-primary-light hover:underline">Yêu cầu link mới</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-sidebar rounded-2xl flex items-center justify-center mb-4">
            <VaultLogo size={40} className="text-warning" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">Vault</h1>
          <p className="text-muted text-sm mt-1">Đặt lại mật khẩu</p>
        </div>

        {done ? (
          <div className="bg-card rounded-2xl border border-border p-6 text-center space-y-4">
            <CheckCircle2 className="w-12 h-12 text-accent mx-auto" />
            <h2 className="text-lg font-semibold text-card-foreground">Đã đặt lại mật khẩu!</h2>
            <p className="text-sm text-muted">Bạn có thể đăng nhập bằng mật khẩu mới.</p>
            <Link href="/login" className="block w-full py-2.5 bg-primary text-white rounded-xl text-sm font-semibold text-center hover:bg-primary-light transition-colors">
              Đăng nhập
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="bg-card rounded-2xl border border-border p-6 space-y-4">
            <div>
              <label className="text-sm font-medium text-card-foreground mb-1.5 block">Mật khẩu mới</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
                <input type={showPass ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)}
                  placeholder="Tối thiểu 6 ký tự" required minLength={6}
                  className="w-full pl-10 pr-10 py-2.5 bg-muted-bg border border-border rounded-xl text-sm text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary-light/30" />
                <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted">
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-card-foreground mb-1.5 block">Xác nhận mật khẩu</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
                <input type={showPass ? "text" : "password"} value={confirm} onChange={(e) => setConfirm(e.target.value)}
                  placeholder="Nhập lại mật khẩu" required minLength={6}
                  className="w-full pl-10 pr-4 py-2.5 bg-muted-bg border border-border rounded-xl text-sm text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary-light/30" />
              </div>
            </div>

            {error && <p className="text-sm text-danger bg-danger/10 px-4 py-2 rounded-xl">{error}</p>}

            <button type="submit" disabled={loading}
              className="w-full py-2.5 bg-primary text-white rounded-xl text-sm font-semibold hover:bg-primary-light transition-colors disabled:opacity-50">
              {loading ? "Đang lưu..." : "Đặt lại mật khẩu"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
