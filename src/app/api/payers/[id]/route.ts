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
  const existing = await prisma.payer.findFirst({ where: { id, userId: payload.userId } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { name, color } = await req.json();
  const payer = await prisma.payer.update({
    where: { id },
    data: {
      name: name !== undefined ? name.trim() : undefined,
      color: color !== undefined ? color : undefined,
    },
  });

  return NextResponse.json({ payer });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const payload = await getUserFromRequest(req);
  if (!payload) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const existing = await prisma.payer.findFirst({ where: { id, userId: payload.userId } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.payer.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
