"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, ArrowRightLeft, Target, MoreHorizontal, PieChart, Settings, PiggyBank, X } from "lucide-react";
import { useT } from "@/lib/i18n";

const mainItems = [
  { icon: LayoutDashboard, labelKey: "nav.dashboard", href: "/" },
  { icon: ArrowRightLeft, labelKey: "nav.transactions", href: "/transactions" },
  { icon: Target, labelKey: "nav.budget", href: "/budget" },
];

const moreItems = [
  { icon: PieChart, labelKey: "nav.statistics", href: "/statistics" },
  { icon: PiggyBank, labelKey: "savings.title", href: "/savings" },
  { icon: Settings, labelKey: "nav.settings", href: "/settings" },
];

export default function BottomNav() {
  const pathname = usePathname();
  const t = useT();
  const [showMore, setShowMore] = useState(false);

  const isMoreActive = moreItems.some((item) => pathname === item.href);

  return (
    <>
      {/* More menu overlay */}
      {showMore && (
        <div className="lg:hidden fixed inset-0 z-40" onClick={() => setShowMore(false)}>
          <div className="absolute bottom-16 left-0 right-0 safe-bottom">
            <div className="mx-4 mb-2 bg-card border border-border rounded-2xl shadow-xl p-2 animate-scale-in">
              {moreItems.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link key={item.href} href={item.href} onClick={() => setShowMore(false)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${isActive ? "bg-primary-light/10 text-primary-light" : "text-card-foreground hover:bg-muted-bg"}`}>
                    <item.icon className="w-5 h-5" />
                    <span className="text-sm font-medium">{t(item.labelKey)}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Bottom nav bar */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border safe-bottom">
        <div className="flex items-center justify-around px-2 py-1">
          {mainItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link key={item.href} href={item.href}
                className={`flex flex-col items-center gap-0.5 py-2 px-4 rounded-xl transition-colors ${isActive ? "text-primary-light" : "text-muted"}`}>
                <item.icon className="w-5 h-5" />
                <span className="text-[10px] font-medium">{t(item.labelKey)}</span>
              </Link>
            );
          })}
          <button onClick={() => setShowMore(!showMore)}
            className={`flex flex-col items-center gap-0.5 py-2 px-4 rounded-xl transition-colors ${showMore || isMoreActive ? "text-primary-light" : "text-muted"}`}>
            {showMore ? <X className="w-5 h-5" /> : <MoreHorizontal className="w-5 h-5" />}
            <span className="text-[10px] font-medium">Thêm</span>
          </button>
        </div>
      </nav>
    </>
  );
}
