import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/server/db";
import { getUserFromRequest } from "@/lib/server/auth";

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const payload = await getUserFromRequest(req);
  if (!payload) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const existing = await prisma.assetType.findFirst({
    where: { id, userId: payload.userId },
  });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (existing.isDefault) return NextResponse.json({ error: "Không thể xóa loại mặc định" }, { status: 400 });

  await prisma.assetType.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
