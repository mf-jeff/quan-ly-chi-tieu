"use client";

import { TrendingUp, TrendingDown, Wallet, ArrowRightLeft } from "lucide-react";
import { formatVND } from "@/lib/utils";
import { useTransactions } from "@/lib/hooks";
import { useT } from "@/lib/i18n";
import { CardSkeleton } from "@/components/ui/Skeleton";

export default function SummaryCards() {
  const { data, isLoading } = useTransactions();
  const t = useT();

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => <CardSkeleton key={i} />)}
      </div>
    );
  }

  const totalIncome = data?.totals?.income || 0;
  const totalExpense = data?.totals?.expense || 0;
  const balance = totalIncome - totalExpense;
  const txCount = data?.pagination?.total || data?.transactions?.length || 0;

  const cards = [
    { title: t("balance"), amount: balance, icon: Wallet, color: "text-primary-light", bgColor: "bg-primary-light/10", tint: "border-t-[3px] border-t-primary-light bg-gradient-to-b from-primary-light/5 to-card" },
    { title: t("income"), amount: totalIncome, icon: TrendingUp, color: "text-accent", bgColor: "bg-accent/10", tint: "border-t-[3px] border-t-accent bg-gradient-to-b from-accent/5 to-card" },
    { title: t("expense"), amount: totalExpense, icon: TrendingDown, color: "text-danger", bgColor: "bg-danger/10", tint: "border-t-[3px] border-t-danger bg-gradient-to-b from-danger/5 to-card" },
    { title: t("transactions"), amount: txCount, icon: ArrowRightLeft, color: "text-warning", bgColor: "bg-warning/10", isCount: true, tint: "border-t-[3px] border-t-warning bg-gradient-to-b from-warning/5 to-card" },
  ];

  return (
    <div className="flex gap-3 scroll-x-mobile sm:grid sm:grid-cols-2 xl:grid-cols-4 sm:gap-4">
      {cards.map((card, i) => (
        <div key={card.title} className={`rounded-2xl p-4 sm:p-5 border border-border card-hover animate-fade-in min-w-[160px] sm:min-w-0 ${card.tint}`} style={{ animationDelay: `${i * 50}ms` }}>
          <div className="flex items-center justify-between mb-3">
            <span className="text-muted text-sm font-medium">{card.title}</span>
            <div className={`${card.bgColor} ${card.color} p-2.5 rounded-xl`}><card.icon className="w-5 h-5" /></div>
          </div>
          <div className={`text-2xl font-bold ${card.isCount ? "text-card-foreground" : card.amount < 0 ? "text-danger" : card.amount > 0 ? "text-card-foreground" : "text-muted"}`}>
            {card.isCount ? card.amount : formatVND(card.amount)}
          </div>
        </div>
      ))}
    </div>
  );
}
