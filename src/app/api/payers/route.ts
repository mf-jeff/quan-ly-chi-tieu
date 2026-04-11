import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/server/db";
import { getUserFromRequest } from "@/lib/server/auth";

export async function GET(req: NextRequest) {
  const payload = await getUserFromRequest(req);
  if (!payload) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const payers = await prisma.payer.findMany({
    where: { userId: payload.userId },
    orderBy: { name: "asc" },
  });

  return NextResponse.json({ payers });
}

export async function POST(req: NextRequest) {
  const payload = await getUserFromRequest(req);
  if (!payload) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { name, color } = await req.json();
  if (!name?.trim()) return NextResponse.json({ error: "Tên là bắt buộc" }, { status: 400 });

  try {
    const payer = await prisma.payer.create({
      data: { userId: payload.userId, name: name.trim(), color: color || "#3b82f6" },
    });
    return NextResponse.json({ payer }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Tên đã tồn tại" }, { status: 409 });
  }
}
