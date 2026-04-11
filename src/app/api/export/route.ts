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
    orderBy: { date: "asc" },
  });

  // Build filename from date range
  let fileName = "giao-dich";
  if (startDate) {
    const d = new Date(startDate);
    const m = d.getMonth() + 1;
    const y = d.getFullYear();
    fileName = `giao dich thang ${m} nam ${y}`;
  }

  const data = transactions.map((tx) => ({
    "Ngày": (() => { const d = new Date(tx.date); return `${String(d.getDate()).padStart(2,"0")}/${String(d.getMonth()+1).padStart(2,"0")}/${d.getFullYear()}`; })(),
    "Người": tx.payer || "",
    "Danh mục": tx.category.name,
    "Ghi chú": tx.note,
    "Số tiền": tx.amount,
    "Thanh toán": tx.paymentMethod === "bank" ? "Chuyển khoản" : tx.paymentMethod === "card" ? "Thẻ" : "Tiền mặt",
    "Loại": tx.type === "income" ? "Thu nhập" : "Chi tiêu",
  }));

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(data);

  ws["!cols"] = [
    { wch: 12 },  // A: Ngày
    { wch: 10 },  // B: Người
    { wch: 15 },  // C: Danh mục
    { wch: 40 },  // D: Ghi chú
    { wch: 15 },  // E: Số tiền
    { wch: 14 },  // F: Thanh toán
    { wch: 12 },  // G: Loại
  ];

  if (format === "csv") {
    const csv = XLSX.utils.sheet_to_csv(ws);
    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename=${encodeURIComponent(fileName)}.csv`,
      },
    });
  }

  XLSX.utils.book_append_sheet(wb, ws, "Giao dịch");
  const buffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

  return new NextResponse(buffer, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename=${encodeURIComponent(fileName)}.xlsx`,
    },
  });
}
