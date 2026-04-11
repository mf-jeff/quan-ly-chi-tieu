import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/server/db";
import { getUserFromRequest } from "@/lib/server/auth";

export async function GET(req: NextRequest) {
  const payload = await getUserFromRequest(req);
  if (!payload) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(req.url);
  const month = Number(url.searchParams.get("month")) || new Date().getMonth() + 1;
  const year = Number(url.searchParams.get("year")) || new Date().getFullYear();
  const compareMonth = Number(url.searchParams.get("compareMonth")) || (month === 1 ? 12 : month - 1);
  const compareYear = Number(url.searchParams.get("compareYear")) || (month === 1 ? year - 1 : year);

  // Current month range
  const curStart = new Date(year, month - 1, 1);
  const curEnd = new Date(year, month, 0, 23, 59, 59);

  // Compare month range
  const prevMonth = compareMonth;
  const prevYear = compareYear;
  const prevStart = new Date(prevYear, prevMonth - 1, 1);
  const prevEnd = new Date(prevYear, prevMonth, 0, 23, 59, 59);

  // Get spending by category for both months
  const [curSpending, prevSpending] = await Promise.all([
    prisma.transaction.groupBy({
      by: ["categoryId"],
      where: { userId: payload.userId, type: "expense", date: { gte: curStart, lte: curEnd } },
      _sum: { amount: true },
    }),
    prisma.transaction.groupBy({
      by: ["categoryId"],
      where: { userId: payload.userId, type: "expense", date: { gte: prevStart, lte: prevEnd } },
      _sum: { amount: true },
    }),
  ]);

  // Get all category IDs involved
  const catIds = new Set<string>();
  curSpending.forEach((s) => catIds.add(s.categoryId));
  prevSpending.forEach((s) => catIds.add(s.categoryId));

  const categories = await prisma.category.findMany({
    where: { id: { in: Array.from(catIds) } },
  });
  const catMap = Object.fromEntries(categories.map((c) => [c.id, c]));

  const curMap: Record<string, number> = {};
  curSpending.forEach((s) => { curMap[s.categoryId] = s._sum.amount || 0; });

  const prevMap: Record<string, number> = {};
  prevSpending.forEach((s) => { prevMap[s.categoryId] = s._sum.amount || 0; });

  const comparison = Array.from(catIds).map((id) => {
    const cur = curMap[id] || 0;
    const prev = prevMap[id] || 0;
    const diff = cur - prev;
    const pct = prev > 0 ? Math.round((diff / prev) * 100) : cur > 0 ? 100 : 0;
    const cat = catMap[id];
    return {
      categoryId: id,
      name: cat?.name || "Khác",
      color: cat?.color || "#94a3b8",
      icon: cat?.icon || "Tag",
      current: cur,
      previous: prev,
      diff,
      pct,
    };
  }).sort((a, b) => Math.abs(b.diff) - Math.abs(a.diff));

  const totalCur = curSpending.reduce((s, v) => s + (v._sum.amount || 0), 0);
  const totalPrev = prevSpending.reduce((s, v) => s + (v._sum.amount || 0), 0);

  return NextResponse.json({
    month, year, prevMonth, prevYear,
    totalCurrent: totalCur,
    totalPrevious: totalPrev,
    totalDiff: totalCur - totalPrev,
    totalPct: totalPrev > 0 ? Math.round(((totalCur - totalPrev) / totalPrev) * 100) : 0,
    categories: comparison,
  });
}
