"use client";

import { useQuery } from "@tanstack/react-query";
import {
  TrendingUp, TrendingDown, PieChart, AlertTriangle, Target, PiggyBank,
  Sparkles, Wallet, BookOpen, Calculator, Brain, ChevronRight,
} from "lucide-react";
import type { LucideProps } from "lucide-react";
import { Skeleton } from "@/components/ui/Skeleton";

const iconMap: Record<string, React.ComponentType<LucideProps>> = {
  TrendingUp, TrendingDown, PieChart, AlertTriangle, Target, PiggyBank,
  Sparkles, Wallet, BookOpen, Calculator,
};

interface Insight {
  type: "warning" | "success" | "tip" | "info";
  icon: string;
  title: string;
  description: string;
}

const typeStyles = {
  warning: { bg: "bg-danger/5 border-danger/20", icon: "text-danger bg-danger/10", dot: "bg-danger" },
  success: { bg: "bg-accent/5 border-accent/20", icon: "text-accent bg-accent/10", dot: "bg-accent" },
  tip: { bg: "bg-warning/5 border-warning/20", icon: "text-warning bg-warning/10", dot: "bg-warning" },
  info: { bg: "bg-primary-light/5 border-primary-light/20", icon: "text-primary-light bg-primary-light/10", dot: "bg-primary-light" },
};

export default function AiInsights() {
  const { data, isLoading } = useQuery({
    queryKey: ["insights"],
    queryFn: async () => {
      const token = localStorage.getItem("token");
      const res = await fetch("/api/insights", { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) throw new Error();
      return res.json() as Promise<{ insights: Insight[] }>;
    },
    staleTime: 60_000,
  });

  const insights = data?.insights || [];

  if (isLoading) {
    return (
      <div className="bg-card rounded-2xl p-5 border border-border">
        <div className="flex items-center gap-2 mb-4">
          <Skeleton className="w-5 h-5 rounded" />
          <Skeleton className="h-5 w-24" />
        </div>
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}
        </div>
      </div>
    );
  }

  if (insights.length === 0) return null;

  return (
    <div className="bg-card rounded-2xl p-5 border border-border animate-fade-in">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-primary-light to-accent flex items-center justify-center">
          <Brain className="w-4 h-4 text-white" />
        </div>
        <h3 className="text-lg font-semibold text-card-foreground">Phân tích thông minh</h3>
      </div>

      <div className="space-y-2.5">
        {insights.map((insight, i) => {
          const style = typeStyles[insight.type];
          const Icon = iconMap[insight.icon] || Sparkles;
          return (
            <div key={i} className={`flex items-start gap-3 p-3.5 rounded-xl border ${style.bg} animate-fade-in-up`} style={{ animationDelay: `${i * 80}ms` }}>
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${style.icon}`}>
                <Icon className="w-4.5 h-4.5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-card-foreground">{insight.title}</p>
                <p className="text-xs text-muted mt-0.5 leading-relaxed">{insight.description}</p>
              </div>
              <div className={`w-2 h-2 rounded-full shrink-0 mt-2 ${style.dot}`} />
            </div>
          );
        })}
      </div>
    </div>
  );
}
