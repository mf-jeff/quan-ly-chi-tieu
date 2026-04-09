"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, ArrowRightLeft, Target, PieChart, Settings } from "lucide-react";
import { useT } from "@/lib/i18n";

const navItems = [
  { icon: LayoutDashboard, labelKey: "nav.dashboard", href: "/" },
  { icon: ArrowRightLeft, labelKey: "nav.transactions", href: "/transactions" },
  { icon: Target, labelKey: "nav.budget", href: "/budget" },
  { icon: PieChart, labelKey: "nav.statistics", href: "/statistics" },
  { icon: Settings, labelKey: "nav.settings", href: "/settings" },
];

export default function BottomNav() {
  const pathname = usePathname();
  const t = useT();

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border safe-bottom">
      <div className="flex items-center justify-around px-1 py-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center gap-0.5 py-2 px-3 rounded-xl min-w-[56px] min-h-[48px] justify-center transition-colors ${
                isActive
                  ? "text-primary-light bg-primary-light/10"
                  : "text-muted hover:text-card-foreground"
              }`}
            >
              <item.icon className={`w-5 h-5 ${isActive ? "text-primary-light" : ""}`} />
              <span className={`text-[10px] font-medium leading-tight ${isActive ? "text-primary-light" : ""}`}>
                {t(item.labelKey)}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
