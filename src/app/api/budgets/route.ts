import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/server/db";
import { getUserFromRequest } from "@/lib/server/auth";

export async function GET(req: NextRequest) {
  const payload = await getUserFromRequest(req);
  if (!payload) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(req.url);
  const month = Number(url.searchParams.get("month")) || new Date().getMonth() + 1;
  const year = Number(url.searchParams.get("year")) || new Date().getFullYear();

  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0, 23, 59, 59);

  // Get existing budgets
  const budgets = await prisma.budget.findMany({
    where: { userId: payload.userId, month, year },
    include: { category: true },
  });

  // Get ALL expense spending this month (including categories without budgets)
  const spent = await prisma.transaction.groupBy({
    by: ["categoryId"],
    where: {
      userId: payload.userId,
      type: "expense",
      date: { gte: startDate, lte: endDate },
    },
    _sum: { amount: true },
  });

  const spentMap: Record<string, number> = {};
  spent.forEach((s) => {
    spentMap[s.categoryId] = s._sum.amount || 0;
  });

  // Build result from existing budgets
  const budgetCategoryIds = new Set(budgets.map((b) => b.categoryId));
  const result = budgets.map((b) => ({
    ...b,
    spent: spentMap[b.categoryId] || 0,
    percentage: b.amount > 0 ? Math.round(((spentMap[b.categoryId] || 0) / b.amount) * 100) : 0,
  }));

  // Add ALL categories that don't have a budget record yet
  const allCategories = await prisma.category.findMany({
    where: { userId: payload.userId, type: { in: ["expense", "both"] } },
  });

  for (const cat of allCategories) {
    if (!budgetCategoryIds.has(cat.id)) {
      result.push({
        id: `auto-${cat.id}`,
        userId: payload.userId,
        categoryId: cat.id,
        amount: 0,
        month,
        year,
        category: cat,
        spent: spentMap[cat.id] || 0,
        percentage: 0,
      });
    }
  }

  return NextResponse.json({ budgets: result });
}

export async function POST(req: NextRequest) {
  const payload = await getUserFromRequest(req);
  if (!payload) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { categoryId, amount, month, year } = await req.json();

    if (!categoryId || amount === undefined) {
      return NextResponse.json({ error: "Danh mục và số tiền là bắt buộc" }, { status: 400 });
    }

    const now = new Date();
    const budget = await prisma.budget.upsert({
      where: {
        userId_categoryId_month_year: {
          userId: payload.userId,
          categoryId,
          month: month || now.getMonth() + 1,
          year: year || now.getFullYear(),
        },
      },
      update: { amount: Number(amount) },
      create: {
        userId: payload.userId,
        categoryId,
        amount: Number(amount),
        month: month || now.getMonth() + 1,
        year: year || now.getFullYear(),
      },
      include: { category: true },
    });

    return NextResponse.json({ budget }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Lỗi server" }, { status: 500 });
  }
}
