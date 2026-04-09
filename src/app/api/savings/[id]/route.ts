import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/server/db";
import { getUserFromRequest } from "@/lib/server/auth";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const payload = await getUserFromRequest(req);
  if (!payload) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();

  const existing = await prisma.savingsItem.findFirst({ where: { id, userId: payload.userId } });
  if (!existing) return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });

  const item = await prisma.savingsItem.update({
    where: { id },
    data: {
      name: body.name,
      amount: body.amount !== undefined ? Number(body.amount) : undefined,
      interestRate: body.interestRate !== undefined ? (body.interestRate ? Number(body.interestRate) : null) : undefined,
      startDate: body.startDate !== undefined ? (body.startDate ? new Date(body.startDate) : null) : undefined,
      maturityDate: body.maturityDate !== undefined ? (body.maturityDate ? new Date(body.maturityDate) : null) : undefined,
      termMonths: body.termMonths !== undefined ? (body.termMonths ? Number(body.termMonths) : null) : undefined,
      goldUnit: body.goldUnit !== undefined ? (body.goldUnit ? Number(body.goldUnit) : null) : undefined,
      goldType: body.goldType !== undefined ? body.goldType : undefined,
      buyPrice: body.buyPrice !== undefined ? (body.buyPrice ? Number(body.buyPrice) : null) : undefined,
      currentPrice: body.currentPrice !== undefined ? (body.currentPrice ? Number(body.currentPrice) : null) : undefined,
      note: body.note !== undefined ? body.note : undefined,
    },
  });

  return NextResponse.json({ success: true, data: item });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const payload = await getUserFromRequest(req);
  if (!payload) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const existing = await prisma.savingsItem.findFirst({ where: { id, userId: payload.userId } });
  if (!existing) return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });

  await prisma.savingsItem.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
