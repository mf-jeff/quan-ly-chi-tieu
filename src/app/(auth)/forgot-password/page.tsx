"use client";

import { useState } from "react";
import Link from "next/link";
import { Mail, ArrowLeft, CheckCircle2 } from "lucide-react";
import VaultLogo from "@/components/VaultLogo";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Lỗi");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-10">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-10 h-10 bg-sidebar rounded-xl flex items-center justify-center shadow-lg">
              <VaultLogo size={28} className="text-warning" />
            </div>
            <h1 className="text-3xl font-extrabold text-foreground tracking-tight">Vault</h1>
          </div>
          <p className="text-muted text-sm">Quên mật khẩu</p>
        </div>

        {sent ? (
          <div className="bg-card rounded-2xl border border-border p-6 text-center space-y-4">
            <CheckCircle2 className="w-12 h-12 text-accent mx-auto" />
            <h2 className="text-lg font-semibold text-card-foreground">Đã gửi email!</h2>
            <p className="text-sm text-muted">Kiểm tra hộp thư <strong>{email}</strong> để đặt lại mật khẩu. Link có hiệu lực trong 1 giờ.</p>
            <Link href="/login" className="block text-sm text-primary-light hover:underline">← Quay lại đăng nhập</Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="bg-card rounded-2xl border border-border p-6 space-y-4">
            <p className="text-sm text-muted">Nhập email đăng ký để nhận link đặt lại mật khẩu.</p>

            <div>
              <label className="text-sm font-medium text-card-foreground mb-1.5 block">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="email@example.com" required
                  className="w-full pl-10 pr-4 py-2.5 bg-muted-bg border border-border rounded-xl text-sm text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary-light/30" />
              </div>
            </div>

            {error && <p className="text-sm text-danger bg-danger/10 px-4 py-2 rounded-xl">{error}</p>}

            <button type="submit" disabled={loading}
              className="w-full py-2.5 bg-primary text-white rounded-xl text-sm font-semibold hover:bg-primary-light transition-colors disabled:opacity-50">
              {loading ? "Đang gửi..." : "Gửi link đặt lại mật khẩu"}
            </button>

            <Link href="/login" className="flex items-center justify-center gap-1 text-sm text-muted hover:text-primary-light">
              <ArrowLeft className="w-4 h-4" />Quay lại đăng nhập
            </Link>
          </form>
        )}
      </div>
    </div>
  );
}
