"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ArrowRightLeft,
  PieChart,
  Target,
  PiggyBank,
  Settings,
  ChevronLeft,
  ChevronRight,
  Menu,
  Moon,
  Sun,
  LogOut,
  RefreshCw,
} from "lucide-react";
import VaultLogo from "@/components/VaultLogo";
import { useTheme } from "@/components/ThemeProvider";
import { useAuth } from "@/lib/auth-store";
import { useT } from "@/lib/i18n";

const navItems = [
  { icon: LayoutDashboard, labelKey: "nav.dashboard", href: "/" },
  { icon: ArrowRightLeft, labelKey: "nav.transactions", href: "/transactions" },
  { icon: PieChart, labelKey: "nav.statistics", href: "/statistics" },
  { icon: Target, labelKey: "nav.budget", href: "/budget" },
  { icon: PiggyBank, labelKey: "savings.title", href: "/savings" },
  { icon: Settings, labelKey: "nav.settings", href: "/settings" },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { theme, toggle: toggleTheme } = useTheme();
  const { logout } = useAuth();
  const tr = useT();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileMenu, setMobileMenu] = useState(false);

  return (
    <>
      {/* Mobile top bar */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-sidebar h-12 flex items-center justify-between px-4">
        <button onClick={() => setMobileMenu(!mobileMenu)} className="flex items-center gap-2">
          <VaultLogo size={24} className="text-warning" />
          <span className="text-warning font-extrabold text-lg">Vault</span>
          <Menu className="w-5 h-5 text-sidebar-foreground/60" />
        </button>
        <button onClick={() => window.location.reload()} className="p-2 text-sidebar-foreground/50 hover:text-sidebar-foreground transition-colors">
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Mobile menu overlay */}
      {mobileMenu && (
        <div className="lg:hidden fixed inset-0 z-40" onClick={() => setMobileMenu(false)}>
          <div className="absolute top-12 left-0 right-0">
            <div className="mx-3 mt-1 bg-sidebar border border-white/10 rounded-2xl shadow-2xl p-2 animate-scale-in">
              {navItems.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link key={item.href} href={item.href} onClick={() => setMobileMenu(false)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${
                      isActive ? "bg-gradient-to-r from-primary to-primary-light/80 text-white" : "text-sidebar-foreground/70 hover:bg-sidebar-hover hover:text-sidebar-foreground"
                    }`}>
                    <item.icon className="w-5 h-5" />
                    <span className="text-sm font-medium">{tr(item.labelKey)}</span>
                  </Link>
                );
              })}
              <div className="border-t border-white/10 mt-1 pt-1">
                <button onClick={() => { toggleTheme(); setMobileMenu(false); }}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl w-full text-sidebar-foreground/70 hover:bg-sidebar-hover transition-colors">
                  {theme === "dark" ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                  <span className="text-sm font-medium">{theme === "dark" ? tr("settings.light") : tr("settings.dark")}</span>
                </button>
                <button onClick={logout}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl w-full text-sidebar-foreground/70 hover:bg-danger/20 hover:text-danger transition-colors">
                  <LogOut className="w-5 h-5" />
                  <span className="text-sm font-medium">{tr("settings.logout")}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Sidebar */}
      <aside
        id="sidebar"
        className={`
          hidden lg:flex fixed top-0 left-0 z-40 h-full bg-sidebar flex-col transition-all duration-300
          ${collapsed ? "w-20" : "w-64"}
          lg:translate-x-0 lg:static
        `}
      >
        {/* Logo */}
        <div className="h-16 flex items-center gap-3 px-5 border-b border-white/10">
          <VaultLogo size={36} className="text-warning shrink-0" />
          {!collapsed && (
            <div>
              <span className="text-warning font-extrabold text-2xl tracking-tight">Vault</span>
              <p className="text-sidebar-foreground/60 text-[11px] tracking-[0.2em] uppercase -mt-0.5 font-medium">Money Manager</p>
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-4 px-3 space-y-1">
          {navItems.map((item) => (
            <Link
              key={item.labelKey}
              href={item.href}
              onClick={() => setMobileMenu(false)}
              className={`
                flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all relative
                ${
                  pathname === item.href
                    ? "bg-gradient-to-r from-primary to-primary-light/80 text-white shadow-lg shadow-primary/20 border-l-[3px] border-warning"
                    : "text-sidebar-foreground/70 hover:bg-sidebar-hover hover:text-sidebar-foreground border-l-[3px] border-transparent"
                }
                ${collapsed ? "justify-center" : ""}
              `}
            >
              <item.icon className="w-5 h-5 shrink-0" />
              {!collapsed && <span className="text-sm font-medium">{tr(item.labelKey)}</span>}
            </Link>
          ))}
        </nav>

        {/* Bottom actions */}
        <div className="border-t border-white/10 p-3 space-y-1">
          <button
            onClick={() => window.location.reload()}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg w-full text-sidebar-foreground/70 hover:bg-sidebar-hover hover:text-sidebar-foreground transition-colors ${collapsed ? "justify-center" : ""}`}
          >
            <RefreshCw className="w-5 h-5 shrink-0" />
            {!collapsed && <span className="text-sm font-medium">Tải lại</span>}
          </button>
          <button
            onClick={toggleTheme}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg w-full text-sidebar-foreground/70 hover:bg-sidebar-hover hover:text-sidebar-foreground transition-colors ${collapsed ? "justify-center" : ""}`}
          >
            {theme === "dark" ? <Sun className="w-5 h-5 shrink-0" /> : <Moon className="w-5 h-5 shrink-0" />}
            {!collapsed && <span className="text-sm font-medium">{theme === "dark" ? tr("settings.light") : tr("settings.dark")}</span>}
          </button>
          <button
            onClick={logout}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg w-full text-sidebar-foreground/70 hover:bg-danger/20 hover:text-danger transition-colors ${collapsed ? "justify-center" : ""}`}
          >
            <LogOut className="w-5 h-5 shrink-0" />
            {!collapsed && <span className="text-sm font-medium">{tr("settings.logout")}</span>}
          </button>
        </div>

        {/* Collapse toggle - desktop only */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="hidden lg:flex items-center justify-center h-12 border-t border-white/10 text-sidebar-foreground/50 hover:text-sidebar-foreground transition-colors"
        >
          {collapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
        </button>
      </aside>
    </>
  );
}
