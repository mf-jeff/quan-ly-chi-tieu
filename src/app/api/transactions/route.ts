import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/server/db";
import { getUserFromRequest } from "@/lib/server/auth";

export async function GET(req: NextRequest) {
  const payload = await getUserFromRequest(req);
  if (!payload) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(req.url);
  const page = Number(url.searchParams.get("page")) || 1;
  const limit = Number(url.searchParams.get("limit")) || 20;
  const type = url.searchParams.get("type"); // income | expense
  const categoryId = url.searchParams.get("categoryId");
  const search = url.searchParams.get("search");
  const startDate = url.searchParams.get("startDate");
  const endDate = url.searchParams.get("endDate");

  const where: Record<string, unknown> = { userId: payload.userId };
  if (type) where.type = type;
  if (categoryId) where.categoryId = categoryId;
  if (search) where.note = { contains: search };
  if (startDate || endDate) {
    where.date = {};
    if (startDate) (where.date as Record<string, unknown>).gte = new Date(startDate);
    if (endDate) (where.date as Record<string, unknown>).lte = new Date(endDate);
  }

  const [transactions, total] = await Promise.all([
    prisma.transaction.findMany({
      where,
      include: { category: true },
      orderBy: { date: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.transaction.count({ where }),
  ]);

  return NextResponse.json({
    transactions,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  });
}

export async function POST(req: NextRequest) {
  const payload = await getUserFromRequest(req);
  if (!payload) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { amount, type, categoryId, note, date, currency, payer, paymentMethod } = await req.json();

    if (!amount || !type || !categoryId) {
      return NextResponse.json(
        { error: "Số tiền, loại và danh mục là bắt buộc" },
        { status: 400 }
      );
    }

    const transaction = await prisma.transaction.create({
      data: {
        userId: payload.userId,
        amount: Number(amount),
        type,
        categoryId,
        note: note || "",
        payer: payer || "",
        paymentMethod: paymentMethod || "cash",
        date: date ? new Date(date) : new Date(),
        currency: currency || "VND",
      },
      include: { category: true },
    });

    return NextResponse.json({ transaction }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Lỗi server" }, { status: 500 });
  }
}
