import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/server/db";
import { getUserFromRequest } from "@/lib/server/auth";

export async function GET(req: NextRequest) {
  const payload = await getUserFromRequest(req);
  if (!payload) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
    select: { id: true, email: true, name: true, currency: true, createdAt: true },
  });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  return NextResponse.json({ user });
}
