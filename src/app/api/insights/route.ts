import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/server/db";
import { getUserFromRequest } from "@/lib/server/auth";

interface Insight {
  type: "warning" | "success" | "tip" | "info";
  icon: string;
  title: string;
  description: string;
}

export async function GET(req: NextRequest) {
  const payload = await getUserFromRequest(req);
  if (!payload) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const now = new Date();
  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const thisMonthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);

  // Get this month's transactions
  const thisMonthTxs = await prisma.transaction.findMany({
    where: { userId: payload.userId, date: { gte: thisMonthStart, lte: thisMonthEnd } },
    include: { category: true },
  });

  // Get last month's transactions
  const lastMonthTxs = await prisma.transaction.findMany({
    where: { userId: payload.userId, date: { gte: lastMonthStart, lte: lastMonthEnd } },
  });

  const thisExpense = thisMonthTxs.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0);
  const thisIncome = thisMonthTxs.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0);
  const lastExpense = lastMonthTxs.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0);
  const lastIncome = lastMonthTxs.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0);

  // Expense by category this month
  const catExpense: Record<string, { name: string; amount: number }> = {};
  thisMonthTxs.filter((t) => t.type === "expense").forEach((t) => {
    if (!catExpense[t.categoryId]) catExpense[t.categoryId] = { name: t.category.name, amount: 0 };
    catExpense[t.categoryId].amount += t.amount;
  });
  const topCat = Object.values(catExpense).sort((a, b) => b.amount - a.amount)[0];

  // Days passed in month
  const daysPassed = now.getDate();
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const dailyAvg = daysPassed > 0 ? thisExpense / daysPassed : 0;
  const projectedExpense = dailyAvg * daysInMonth;

  // Budget check
  const budgets = await prisma.budget.findMany({
    where: { userId: payload.userId, month: now.getMonth() + 1, year: now.getFullYear() },
    include: { category: true },
  });

  const insights: Insight[] = [];

  // 1. Compare with last month
  if (lastExpense > 0) {
    const changePct = Math.round(((thisExpense - lastExpense) / lastExpense) * 100);
    if (changePct > 30) {
      insights.push({
        type: "warning",
        icon: "TrendingUp",
        title: `Chi tiêu tăng ${changePct}% so với tháng trước`,
        description: `Tháng này bạn đã chi ${formatVND(thisExpense)}, tháng trước chỉ ${formatVND(lastExpense)}. Hãy xem xét cắt giảm.`,
      });
    } else if (changePct < -10) {
      insights.push({
        type: "success",
        icon: "TrendingDown",
        title: `Tuyệt vời! Chi tiêu giảm ${Math.abs(changePct)}%`,
        description: `Bạn đang tiết kiệm tốt hơn tháng trước. Tiếp tục phát huy!`,
      });
    }
  }

  // 2. Projected overspend
  if (daysPassed >= 5 && projectedExpense > thisExpense * 1.2) {
    insights.push({
      type: "info",
      icon: "Calculator",
      title: `Dự kiến chi ${formatVND(Math.round(projectedExpense))} tháng này`,
      description: `Dựa trên ${daysPassed} ngày qua, trung bình ${formatVND(Math.round(dailyAvg))}/ngày.`,
    });
  }

  // 3. Top category warning
  if (topCat && thisExpense > 0) {
    const topPct = Math.round((topCat.amount / thisExpense) * 100);
    if (topPct > 40) {
      insights.push({
        type: "warning",
        icon: "PieChart",
        title: `${topCat.name} chiếm ${topPct}% chi tiêu`,
        description: `Danh mục "${topCat.name}" đang chiếm phần lớn chi tiêu. Xem xét phân bổ đều hơn.`,
      });
    }
  }

  // 4. Budget alerts
  for (const b of budgets) {
    const spent = catExpense[b.categoryId]?.amount || 0;
    if (b.amount > 0) {
      const pct = Math.round((spent / b.amount) * 100);
      if (pct > 100) {
        insights.push({
          type: "warning",
          icon: "AlertTriangle",
          title: `Vượt ngân sách ${b.category.name}`,
          description: `Đã chi ${formatVND(spent)} / ${formatVND(b.amount)} (${pct}%). Vượt ${formatVND(spent - b.amount)}.`,
        });
      } else if (pct >= 80) {
        insights.push({
          type: "tip",
          icon: "Target",
          title: `${b.category.name} gần hết ngân sách (${pct}%)`,
          description: `Còn ${formatVND(b.amount - spent)} cho ${daysInMonth - daysPassed} ngày còn lại.`,
        });
      }
    }
  }

  // 5. Savings tip
  if (thisIncome > 0 && thisExpense > 0) {
    const savingsRate = Math.round(((thisIncome - thisExpense) / thisIncome) * 100);
    if (savingsRate < 20 && savingsRate >= 0) {
      insights.push({
        type: "tip",
        icon: "PiggyBank",
        title: `Tỷ lệ tiết kiệm: ${savingsRate}%`,
        description: `Chuyên gia khuyên tiết kiệm ít nhất 20% thu nhập. Thử cắt giảm chi tiêu không cần thiết.`,
      });
    } else if (savingsRate >= 30) {
      insights.push({
        type: "success",
        icon: "Sparkles",
        title: `Tiết kiệm xuất sắc: ${savingsRate}%!`,
        description: `Bạn đang tiết kiệm ${formatVND(thisIncome - thisExpense)} tháng này. Rất tốt!`,
      });
    }
  }

  // 6. No income warning
  if (thisIncome === 0 && thisExpense > 0) {
    insights.push({
      type: "info",
      icon: "Wallet",
      title: "Chưa ghi nhận thu nhập tháng này",
      description: "Hãy thêm giao dịch thu nhập để theo dõi tỷ lệ tiết kiệm chính xác.",
    });
  }

  // 7. Streak / consistency
  if (thisMonthTxs.length === 0) {
    insights.push({
      type: "tip",
      icon: "BookOpen",
      title: "Bắt đầu ghi chép!",
      description: "Ghi chép chi tiêu mỗi ngày giúp bạn kiểm soát tài chính tốt hơn.",
    });
  }

  return NextResponse.json({ insights: insights.slice(0, 5) });
}

function formatVND(amount: number): string {
  return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(amount);
}
