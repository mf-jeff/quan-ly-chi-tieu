import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/server/db";
import { getUserFromRequest } from "@/lib/server/auth";

export async function GET(req: NextRequest) {
  const payload = await getUserFromRequest(req);
  if (!payload) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const categories = await prisma.category.findMany({
    where: { userId: payload.userId },
    include: {
      _count: { select: { transactions: true } },
    },
    orderBy: { name: "asc" },
  });

  return NextResponse.json({ categories });
}

export async function POST(req: NextRequest) {
  const payload = await getUserFromRequest(req);
  if (!payload) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { name, color, icon, type } = await req.json();

    if (!name) {
      return NextResponse.json({ error: "Tên danh mục là bắt buộc" }, { status: 400 });
    }

    const category = await prisma.category.create({
      data: {
        userId: payload.userId,
        name,
        color: color || "#3b82f6",
        icon: icon || "Tag",
        type: type || "expense",
      },
    });

    return NextResponse.json({ category }, { status: 201 });
  } catch (e: unknown) {
    if (e && typeof e === "object" && "code" in e && e.code === "P2002") {
      return NextResponse.json({ error: "Danh mục đã tồn tại" }, { status: 409 });
    }
    return NextResponse.json({ error: "Lỗi server" }, { status: 500 });
  }
}
