import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/server/db";
import { getUserFromRequest } from "@/lib/server/auth";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const payload = await getUserFromRequest(req);
  if (!payload) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();

  const existing = await prisma.loan.findFirst({ where: { id, userId: payload.userId } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const loan = await prisma.loan.update({
    where: { id },
    data: {
      lender: body.lender,
      borrower: body.borrower,
      amount: body.amount !== undefined ? Number(body.amount) : undefined,
      interestRate: body.interestRate !== undefined ? (body.interestRate ? Number(body.interestRate) : null) : undefined,
      dueDate: body.dueDate !== undefined ? (body.dueDate ? new Date(body.dueDate) : null) : undefined,
      isPaid: body.isPaid,
      note: body.note !== undefined ? body.note : undefined,
    },
  });

  return NextResponse.json({ loan });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const payload = await getUserFromRequest(req);
  if (!payload) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const existing = await prisma.loan.findFirst({ where: { id, userId: payload.userId } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.loan.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
