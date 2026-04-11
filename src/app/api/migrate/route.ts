import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/server/db";

export async function GET(req: NextRequest) {
  // Protect with a simple secret param
  const key = new URL(req.url).searchParams.get("key");
  if (key !== process.env.JWT_SECRET) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    // Payers table
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "payers" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "user_id" TEXT NOT NULL,
        "name" TEXT NOT NULL,
        "color" TEXT NOT NULL DEFAULT '#3b82f6',
        CONSTRAINT "payers_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
      )
    `);
    await prisma.$executeRawUnsafe(`
      CREATE UNIQUE INDEX IF NOT EXISTS "payers_user_id_name_key" ON "payers"("user_id", "name")
    `);

    // Loan payments table (if not exists)
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "loan_payments" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "loan_id" TEXT NOT NULL,
        "amount" REAL NOT NULL,
        "note" TEXT,
        "date" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "loan_payments_loan_id_fkey" FOREIGN KEY ("loan_id") REFERENCES "loans" ("id") ON DELETE CASCADE ON UPDATE CASCADE
      )
    `);
    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS "loan_payments_loan_id_idx" ON "loan_payments"("loan_id")
    `);

    return NextResponse.json({ success: true, message: "All tables created" });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
