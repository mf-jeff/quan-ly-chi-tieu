import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/server/db";
import { getUserFromRequest } from "@/lib/server/auth";

export async function GET(req: NextRequest) {
  const payload = await getUserFromRequest(req);
  if (!payload) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
    select: { currency: true, language: true, totalBudget: true },
  });

  return NextResponse.json({ settings: user });
}

export async function PUT(req: NextRequest) {
  const payload = await getUserFromRequest(req);
  if (!payload) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();

  const user = await prisma.user.update({
    where: { id: payload.userId },
    data: {
      currency: body.currency,
      language: body.language,
      totalBudget: body.totalBudget !== undefined ? Number(body.totalBudget) : undefined,
    },
    select: { currency: true, language: true, totalBudget: true },
  });

  return NextResponse.json({ settings: user });
}
