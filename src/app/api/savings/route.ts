import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/server/db";
import { getUserFromRequest } from "@/lib/server/auth";

export async function GET(req: NextRequest) {
  const payload = await getUserFromRequest(req);
  if (!payload) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

  const url = new URL(req.url);
  const type = url.searchParams.get("type"); // CASH | SAVINGS_BOOK | GOLD

  const where: Record<string, unknown> = { userId: payload.userId };
  if (type) where.type = type;

  const items = await prisma.savingsItem.findMany({
    where,
    orderBy: { createdAt: "desc" },
  });

  // Calculate totals
  let totalAssets = 0;
  let totalInterest = 0;
  let goldTotalBuy = 0;
  let goldTotalCurrent = 0;
  let goldTotalUnit = 0;
  let goldHasPrice = false;

  items.forEach((item) => {
    if (item.type === "CASH") {
      totalAssets += item.amount;
    } else if (item.type === "SAVINGS_BOOK") {
      totalAssets += item.amount;
      if (item.interestRate && item.startDate && item.maturityDate) {
        const days = (item.maturityDate.getTime() - item.startDate.getTime()) / (1000 * 60 * 60 * 24);
        totalInterest += (item.amount * item.interestRate * days) / (365 * 100);
      }
    } else if (item.type === "GOLD") {
      totalAssets += item.amount;
      if (item.goldUnit && item.buyPrice) {
        goldTotalBuy += item.goldUnit * item.buyPrice;
        goldTotalUnit += item.goldUnit;
        if (item.currentPrice) {
          goldTotalCurrent += item.goldUnit * item.currentPrice;
          goldHasPrice = true;
        }
      }
    }
  });

  const goldProfitLoss = goldHasPrice ? goldTotalCurrent - goldTotalBuy : null;

  return NextResponse.json({
    success: true,
    data: items,
    summary: { totalAssets, totalInterest, totalItems: items.length },
    goldSummary: { totalUnit: goldTotalUnit, totalBuy: goldTotalBuy, totalCurrent: goldTotalCurrent, profitLoss: goldProfitLoss },
  });
}

export async function POST(req: NextRequest) {
  const payload = await getUserFromRequest(req);
  if (!payload) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const { type, name, amount } = body;

    if (!type || !name || !amount || amount <= 0) {
      return NextResponse.json({ success: false, error: "Tên, loại và số tiền là bắt buộc" }, { status: 400 });
    }

    if (!["CASH", "SAVINGS_BOOK", "GOLD"].includes(type)) {
      return NextResponse.json({ success: false, error: "Loại không hợp lệ" }, { status: 400 });
    }

    if (type === "SAVINGS_BOOK") {
      if (body.maturityDate && body.startDate && new Date(body.maturityDate) <= new Date(body.startDate)) {
        return NextResponse.json({ success: false, error: "Ngày đáo hạn phải sau ngày gửi" }, { status: 400 });
      }
    }

    const item = await prisma.savingsItem.create({
      data: {
        userId: payload.userId,
        type,
        name,
        amount: Number(amount),
        interestRate: body.interestRate ? Number(body.interestRate) : null,
        startDate: body.startDate ? new Date(body.startDate) : null,
        maturityDate: body.maturityDate ? new Date(body.maturityDate) : null,
        termMonths: body.termMonths ? Number(body.termMonths) : null,
        goldUnit: body.goldUnit ? Number(body.goldUnit) : null,
        goldType: body.goldType || null,
        buyPrice: body.buyPrice ? Number(body.buyPrice) : null,
        note: body.note || null,
      },
    });

    return NextResponse.json({ success: true, data: item }, { status: 201 });
  } catch {
    return NextResponse.json({ success: false, error: "Lỗi server" }, { status: 500 });
  }
}
