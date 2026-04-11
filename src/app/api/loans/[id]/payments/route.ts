import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/server/db";
import { getUserFromRequest } from "@/lib/server/auth";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const payload = await getUserFromRequest(req);
  if (!payload) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const loan = await prisma.loan.findFirst({ where: { id, userId: payload.userId } });
  if (!loan) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const payments = await prisma.loanPayment.findMany({
    where: { loanId: id },
    orderBy: { date: "desc" },
  });

  return NextResponse.json({ payments });
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const payload = await getUserFromRequest(req);
  if (!payload) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const loan = await prisma.loan.findFirst({ where: { id, userId: payload.userId } });
  if (!loan) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { amount, note, date } = await req.json();
  if (!amount || Number(amount) <= 0) {
    return NextResponse.json({ error: "Số tiền không hợp lệ" }, { status: 400 });
  }

  const payment = await prisma.loanPayment.create({
    data: {
      loanId: id,
      amount: Number(amount),
      note: note || null,
      date: date ? new Date(date) : new Date(),
    },
  });

  // Update loan paidAmount
  const allPayments = await prisma.loanPayment.findMany({ where: { loanId: id } });
  const totalPaid = allPayments.reduce((s, p) => s + p.amount, 0);
  await prisma.loan.update({
    where: { id },
    data: { paidAmount: totalPaid, isPaid: totalPaid >= loan.amount },
  });

  return NextResponse.json({ payment, totalPaid }, { status: 201 });
}
