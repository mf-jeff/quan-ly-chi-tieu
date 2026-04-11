import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/server/db";
import { getUserFromRequest } from "@/lib/server/auth";
import * as XLSX from "xlsx";

function parseDate(raw: unknown): Date {
  if (!raw) return new Date();

  // If XLSX returned a Date object (cellDates: true)
  if (raw instanceof Date) {
    if (!isNaN(raw.getTime())) return raw;
    return new Date();
  }

  const str = String(raw).trim();

  // DD/MM/YYYY or D/M/YYYY — ALWAYS assume Vietnamese format (day first)
  const dmy = str.match(/^(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{2,4})$/);
  if (dmy) {
    let day = Number(dmy[1]);
    let month = Number(dmy[2]);
    let year = Number(dmy[3]);
    if (year < 100) year += 2000;

    // Sanity check: if month > 12, swap day and month (user might have MM/DD)
    if (month > 12 && day <= 12) {
      [day, month] = [month, day];
    }

    return new Date(year, month - 1, day);
  }

  // YYYY-MM-DD (ISO format)
  const iso = str.match(/^(\d{4})[/\-.](\d{1,2})[/\-.](\d{1,2})/);
  if (iso) {
    return new Date(Number(iso[1]), Number(iso[2]) - 1, Number(iso[3]));
  }

  // Serial number (from Excel)
  const num = Number(str);
  if (!isNaN(num) && num > 40000 && num < 60000) {
    return new Date((num - 25569) * 86400 * 1000);
  }

  const parsed = new Date(str);
  return isNaN(parsed.getTime()) ? new Date() : parsed;
}

// Map each header to a role based on keywords
type ColRole = "date" | "payer" | "category" | "note" | "amount" | "type" | "payment";

function detectColumns(headers: string[]): Record<ColRole, string | null> {
  const map: Record<ColRole, string | null> = {
    date: null, payer: null, category: null, note: null, amount: null, type: null, payment: null,
  };

  // Rules: ordered from most specific to least
  const rules: [ColRole, RegExp][] = [
    ["amount", /s[oố]\s*ti[eề]n|amount/i],
    ["date", /ng[aà]y|date/i],
    ["payer", /ng[uư][oờ]i|payer/i],
    ["category", /m[uụ]c\s*l[oớ]n|danh\s*m[uụ]c|m[uụ]c|category/i],
    ["note", /chi\s*ti[eế]t|ghi\s*ch[uú]|note|m[oô]\s*t[aả]|description/i],
    ["type", /lo[aạ]i|type/i],
    ["payment", /thanh\s*to[aá]n|payment/i],
  ];

  for (const h of headers) {
    for (const [role, regex] of rules) {
      if (!map[role] && regex.test(h)) {
        map[role] = h;
        break;
      }
    }
  }

  return map;
}

export async function POST(req: NextRequest) {
  const payload = await getUserFromRequest(req);
  if (!payload) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;
    if (!file) return NextResponse.json({ error: "Chưa chọn file" }, { status: 400 });
    const amountUnit = formData.get("amountUnit") as string || "dong";

    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: "array", cellDates: false });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];

    // Force all date cells to be read as DD/MM/YYYY strings
    // Walk through cells and convert any date serial to DD/MM/YYYY
    for (const addr of Object.keys(sheet)) {
      if (addr[0] === "!") continue;
      const cell = sheet[addr];
      if (cell && cell.t === "n" && cell.w && /\d+\/\d+\/\d+/.test(cell.w)) {
        // Cell is a number but displayed as date — use the formatted string
        cell.t = "s";
        cell.v = cell.w;
      }
    }

    const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet);

    if (rows.length === 0) return NextResponse.json({ error: "File trống" }, { status: 400 });

    const headers = Object.keys(rows[0]);
    const cols = detectColumns(headers);

    if (!cols.amount) {
      return NextResponse.json({ error: `Không tìm thấy cột số tiền. Các cột: ${headers.join(", ")}` }, { status: 400 });
    }

    // Check if amount uses "k" (thousands) — from header or user selection
    const isThousands = amountUnit === "k" || (cols.amount ? /k\b|\(k\)/i.test(cols.amount) : false);

    // Get user's categories
    const categories = await prisma.category.findMany({ where: { userId: payload.userId } });
    const catMap: Record<string, string> = {};
    categories.forEach((c) => { catMap[c.name.toLowerCase()] = c.id; });

    const otherCat = categories.find((c) => c.name.toLowerCase() === "khác" || c.name.toLowerCase() === "other");
    const fallbackCatId = otherCat?.id || categories[0]?.id;

    if (!fallbackCatId) {
      return NextResponse.json({ error: "Chưa có danh mục nào. Tạo danh mục trước." }, { status: 400 });
    }

    let imported = 0;
    let skipped = 0;
    let categoriesCreated = 0;
    const errors: string[] = [];
    const newCategoryNames: string[] = [];
    const importedDetails: Array<{ row: number; category: string; amount: number; note: string }> = [];

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const rowNum = i + 2;

      try {
        // Amount
        let amount = Number(cols.amount ? row[cols.amount] : 0);
        if (!amount || isNaN(amount)) {
          skipped++;
          if (errors.length < 10) errors.push(`Dòng ${rowNum}: Số tiền không hợp lệ`);
          continue;
        }
        if (isThousands) amount = amount * 1000;
        const finalAmount = Math.abs(amount);

        // Type
        let type: "income" | "expense" = amount < 0 ? "expense" : "expense";
        if (cols.type) {
          const rawType = String(row[cols.type] || "").toLowerCase();
          if (rawType.includes("thu") || rawType.includes("income")) type = "income";
        }

        // Category
        const rawCat = cols.category ? String(row[cols.category] || "").trim() : "";
        const rawCatLower = rawCat.toLowerCase();
        let categoryId = catMap[rawCatLower];

        // Auto-create if not found
        if (!categoryId && rawCat) {
          const catName = rawCat.charAt(0).toUpperCase() + rawCat.slice(1);
          try {
            const created = await prisma.category.upsert({
              where: { userId_name: { userId: payload.userId, name: catName } },
              update: {},
              create: { userId: payload.userId, name: catName, type: "expense" },
            });
            catMap[rawCatLower] = created.id;
            if (!catMap[rawCatLower + "_counted"]) {
              catMap[rawCatLower + "_counted"] = "1";
              categoriesCreated++;
              newCategoryNames.push(catName);
            }
            categoryId = created.id;
          } catch {
            categoryId = fallbackCatId;
          }
        }
        if (!categoryId) categoryId = fallbackCatId;

        // Note
        const note = cols.note ? String(row[cols.note] || "").trim() : "";

        // Payer
        const payer = cols.payer ? String(row[cols.payer] || "").trim() : "";

        // Payment method
        let paymentMethod = "cash";
        if (cols.payment) {
          const rawPay = String(row[cols.payment] || "").toLowerCase();
          if (rawPay.includes("chuyển") || rawPay.includes("bank") || rawPay === "ck") paymentMethod = "bank";
          else if (rawPay.includes("thẻ") || rawPay.includes("card")) paymentMethod = "card";
          else if (rawPay.includes("tiền mặt") || rawPay === "tm" || rawPay.includes("cash")) paymentMethod = "cash";
        }

        // Date
        const date = parseDate(cols.date ? row[cols.date] : null);

        await prisma.transaction.create({
          data: {
            userId: payload.userId,
            amount: finalAmount,
            type,
            categoryId,
            note,
            payer,
            paymentMethod,
            date,
          },
        });
        imported++;
        importedDetails.push({ row: rowNum, category: rawCat.charAt(0).toUpperCase() + rawCat.slice(1), amount: finalAmount, note });
      } catch {
        skipped++;
        if (errors.length < 10) errors.push(`Dòng ${rowNum}: Lỗi xử lý`);
      }
    }

    return NextResponse.json({
      success: true,
      imported,
      skipped,
      categoriesCreated,
      newCategories: newCategoryNames,
      total: rows.length,
      errors: errors.slice(0, 10),
    });
  } catch (e) {
    return NextResponse.json({ error: "Lỗi đọc file: " + (e instanceof Error ? e.message : "") }, { status: 500 });
  }
}
