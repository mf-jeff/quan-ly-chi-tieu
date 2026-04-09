import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/server/db";
import { getUserFromRequest } from "@/lib/server/auth";

const defaultTypes = [
  { typeKey: "CASH", name: "Tiền mặt", icon: "Wallet", color: "#3b82f6" },
  { typeKey: "GOLD", name: "Vàng", icon: "CircleDollarSign", color: "#f59e0b" },
  { typeKey: "SAVINGS_BOOK", name: "Sổ tiết kiệm", icon: "BookOpen", color: "#10b981" },
];

async function ensureDefaults(userId: string) {
  const existing = await prisma.assetType.count({ where: { userId } });
  if (existing === 0) {
    await prisma.assetType.createMany({
      data: defaultTypes.map((t) => ({ ...t, userId, isDefault: true })),
    });
  }
}

export async function GET(req: NextRequest) {
  const payload = await getUserFromRequest(req);
  if (!payload) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await ensureDefaults(payload.userId);

  const types = await prisma.assetType.findMany({
    where: { userId: payload.userId },
    orderBy: { isDefault: "desc" },
  });

  return NextResponse.json({ types });
}

export async function POST(req: NextRequest) {
  const payload = await getUserFromRequest(req);
  if (!payload) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { name, icon, color } = await req.json();
  if (!name?.trim()) return NextResponse.json({ error: "Tên là bắt buộc" }, { status: 400 });

  const typeKey = name.trim().toUpperCase().replace(/\s+/g, "_") + "_" + Date.now();

  try {
    const type = await prisma.assetType.create({
      data: {
        userId: payload.userId,
        typeKey,
        name: name.trim(),
        icon: icon || "Tag",
        color: color || "#8b5cf6",
        isDefault: false,
      },
    });
    return NextResponse.json({ type }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Lỗi server" }, { status: 500 });
  }
}
