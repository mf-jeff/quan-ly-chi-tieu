import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/server/db";
import { getUserFromRequest } from "@/lib/server/auth";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; paymentId: string }> }
) {
  const payload = await getUserFromRequest(req);
  if (!payload) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id, paymentId } = await params;
  const loan = await prisma.loan.findFirst({ where: { id, userId: payload.userId } });
  if (!loan) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { amount, note, date } = await req.json();

  await prisma.loanPayment.update({
    where: { id: paymentId },
    data: {
      amount: amount !== undefined ? Number(amount) : undefined,
      note: note !== undefined ? note : undefined,
      date: date ? new Date(date) : undefined,
    },
  });

  // Recalculate total
  const allPayments = await prisma.loanPayment.findMany({ where: { loanId: id } });
  const totalPaid = allPayments.reduce((s, p) => s + p.amount, 0);
  await prisma.loan.update({
    where: { id },
    data: { paidAmount: totalPaid, isPaid: totalPaid >= loan.amount },
  });

  return NextResponse.json({ success: true, totalPaid });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; paymentId: string }> }
) {
  const payload = await getUserFromRequest(req);
  if (!payload) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id, paymentId } = await params;
  const loan = await prisma.loan.findFirst({ where: { id, userId: payload.userId } });
  if (!loan) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.loanPayment.delete({ where: { id: paymentId } });

  // Recalculate total
  const allPayments = await prisma.loanPayment.findMany({ where: { loanId: id } });
  const totalPaid = allPayments.reduce((s, p) => s + p.amount, 0);
  await prisma.loan.update({
    where: { id },
    data: { paidAmount: totalPaid, isPaid: totalPaid >= loan.amount },
  });

  return NextResponse.json({ success: true, totalPaid });
}
