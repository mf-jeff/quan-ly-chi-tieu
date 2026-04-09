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
  const data = await req.json();

  const existing = await prisma.transaction.findFirst({
    where: { id, userId: payload.userId },
  });
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const transaction = await prisma.transaction.update({
    where: { id },
    data: {
      amount: data.amount !== undefined ? Number(data.amount) : undefined,
      type: data.type,
      categoryId: data.categoryId,
      note: data.note,
      payer: data.payer,
      paymentMethod: data.paymentMethod,
      date: data.date ? new Date(data.date) : undefined,
    },
    include: { category: true },
  });

  return NextResponse.json({ transaction });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const payload = await getUserFromRequest(req);
  if (!payload) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const existing = await prisma.transaction.findFirst({
    where: { id, userId: payload.userId },
  });
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await prisma.transaction.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
