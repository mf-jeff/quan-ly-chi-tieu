"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-store";
import VaultLogo from "@/components/VaultLogo";

const publicPaths = ["/login", "/register"];

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const { user, isLoading, loadUser } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  useEffect(() => {
    if (isLoading) return;
    const isPublic = publicPaths.includes(pathname);

    if (!user && !isPublic) {
      router.push("/login");
    } else if (user && isPublic) {
      router.push("/");
    }
  }, [user, isLoading, pathname, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4 animate-fade-in">
          <div className="relative">
            <VaultLogo size={48} className="text-warning" />
            <div className="absolute inset-0 animate-ping opacity-20">
              <VaultLogo size={48} className="text-warning" />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="spinner" />
            <p className="text-muted text-sm font-medium">Vault</p>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
