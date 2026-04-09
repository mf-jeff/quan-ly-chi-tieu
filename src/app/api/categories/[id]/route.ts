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

  const existing = await prisma.category.findFirst({
    where: { id, userId: payload.userId },
  });
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const category = await prisma.category.update({
    where: { id },
    data: {
      name: data.name,
      color: data.color,
      icon: data.icon,
      type: data.type,
    },
  });

  return NextResponse.json({ category });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const payload = await getUserFromRequest(req);
  if (!payload) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const existing = await prisma.category.findFirst({
    where: { id, userId: payload.userId },
  });
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const url = new URL(req.url);
  const moveTo = url.searchParams.get("moveTo");
  const deleteAll = url.searchParams.get("deleteAll");

  const txCount = await prisma.transaction.count({ where: { categoryId: id } });

  if (txCount > 0) {
    if (deleteAll === "true") {
      // Delete all transactions then category
      await prisma.transaction.deleteMany({ where: { categoryId: id } });
    } else if (moveTo) {
      // Move transactions to another category
      const target = await prisma.category.findFirst({
        where: { id: moveTo, userId: payload.userId },
      });
      if (!target) {
        return NextResponse.json({ error: "Danh mục đích không tồn tại" }, { status: 400 });
      }
      await prisma.transaction.updateMany({
        where: { categoryId: id },
        data: { categoryId: moveTo },
      });
    } else {
      return NextResponse.json(
        { error: "HAS_TRANSACTIONS", txCount },
        { status: 400 }
      );
    }
  }

  await prisma.category.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
