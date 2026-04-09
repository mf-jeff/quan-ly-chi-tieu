"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Mail, Lock, Eye, EyeOff } from "lucide-react";
import VaultLogo from "@/components/VaultLogo";
import { useAuth } from "@/lib/auth-store";
import { useT } from "@/lib/i18n";

export default function LoginPage() {
  const { login } = useAuth();
  const t = useT();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(email, password);
      router.push("/");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Đăng nhập thất bại");
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
          <p className="text-muted text-sm">{t("auth.loginTitle")}</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-card rounded-2xl border border-border p-6 space-y-5 shadow-lg">
          {/* Email */}
          <div>
            <label className="text-sm font-medium text-card-foreground mb-1.5 block">{t("auth.email")}</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="email@example.com"
                required
                className="w-full pl-10 pr-4 py-3 bg-muted-bg border border-border rounded-xl text-sm text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary-light/30"
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-sm font-medium text-card-foreground">{t("auth.password")}</label>
              <Link href="/forgot-password" className="text-xs text-primary-light hover:underline">
                Quên mật khẩu?
              </Link>
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
              <input
                type={showPass ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••"
                required
                minLength={6}
                className="w-full pl-10 pr-12 py-3 bg-muted-bg border border-border rounded-xl text-sm text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary-light/30"
              />
              <button
                type="button"
                onClick={() => setShowPass(!showPass)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-card-foreground p-1"
              >
                {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Error */}
          {error && (
            <p className="text-sm text-danger bg-danger/10 px-4 py-2.5 rounded-xl">{error}</p>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-primary text-white rounded-xl text-sm font-semibold hover:bg-primary-light transition-colors disabled:opacity-50"
          >
            {loading ? t("auth.loggingIn") : t("auth.login")}
          </button>

          {/* Register link */}
          <p className="text-center text-sm text-muted">
            {t("auth.noAccount")}{" "}
            <Link href="/register" className="text-primary-light hover:underline font-medium">
              {t("auth.register")}
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
