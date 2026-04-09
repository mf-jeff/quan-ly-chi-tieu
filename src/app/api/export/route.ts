import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/server/db";
import { getUserFromRequest } from "@/lib/server/auth";
import * as XLSX from "xlsx";

export async function GET(req: NextRequest) {
  const payload = await getUserFromRequest(req);
  if (!payload) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(req.url);
  const format = url.searchParams.get("format") || "xlsx";
  const startDate = url.searchParams.get("startDate");
  const endDate = url.searchParams.get("endDate");

  const where: Record<string, unknown> = { userId: payload.userId };
  if (startDate || endDate) {
    where.date = {};
    if (startDate) (where.date as Record<string, unknown>).gte = new Date(startDate);
    if (endDate) (where.date as Record<string, unknown>).lte = new Date(endDate);
  }

  const transactions = await prisma.transaction.findMany({
    where,
    include: { category: true },
    orderBy: { date: "desc" },
  });

  const data = transactions.map((tx) => ({
    "Ngày": new Date(tx.date).toLocaleDateString("vi-VN"),
    "Loại": tx.type === "income" ? "Thu nhập" : "Chi tiêu",
    "Danh mục": tx.category.name,
    "Số tiền": tx.amount,
    "Ghi chú": tx.note,
    "Tiền tệ": tx.currency,
  }));

  if (format === "csv") {
    const ws = XLSX.utils.json_to_sheet(data);
    const csv = XLSX.utils.sheet_to_csv(ws);
    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": "attachment; filename=giao-dich.csv",
      },
    });
  }

  // Default: xlsx
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(data);
  XLSX.utils.book_append_sheet(wb, ws, "Giao dịch");
  const buffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

  return new NextResponse(buffer, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": "attachment; filename=giao-dich.xlsx",
    },
  });
}
