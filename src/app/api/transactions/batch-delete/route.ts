import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/server/db";
import { getUserFromRequest } from "@/lib/server/auth";

export async function POST(req: NextRequest) {
  const payload = await getUserFromRequest(req);
  if (!payload) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { ids } = await req.json();
  if (!ids || !Array.isArray(ids) || ids.length === 0) {
    return NextResponse.json({ error: "Danh sách ID là bắt buộc" }, { status: 400 });
  }

  const result = await prisma.transaction.deleteMany({
    where: {
      id: { in: ids },
      userId: payload.userId,
    },
  });

  return NextResponse.json({ success: true, deleted: result.count });
}
