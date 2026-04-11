import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/server/db";
import { getUserFromRequest } from "@/lib/server/auth";

export async function GET(req: NextRequest) {
  const payload = await getUserFromRequest(req);
  if (!payload) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const loans = await prisma.loan.findMany({
    where: { userId: payload.userId },
    orderBy: { createdAt: "desc" },
  });

  const totalLent = loans.filter((l) => !l.isPaid).reduce((s, l) => s + l.amount, 0);
  const totalPaid = loans.filter((l) => l.isPaid).reduce((s, l) => s + l.amount, 0);

  return NextResponse.json({ loans, totalLent, totalPaid });
}

export async function POST(req: NextRequest) {
  const payload = await getUserFromRequest(req);
  if (!payload) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { type, lender, borrower, amount, interestRate, date, dueDate, note } = await req.json();

  if (!lender || !borrower || !amount) {
    return NextResponse.json({ error: "Người cho vay, người vay và số tiền là bắt buộc" }, { status: 400 });
  }

  const loan = await prisma.loan.create({
    data: {
      userId: payload.userId,
      type: type || "lend",
      lender,
      borrower,
      amount: Number(amount),
      interestRate: interestRate ? Number(interestRate) : null,
      date: date ? new Date(date) : new Date(),
      dueDate: dueDate ? new Date(dueDate) : null,
      note: note || null,
    },
  });

  return NextResponse.json({ loan }, { status: 201 });
}
