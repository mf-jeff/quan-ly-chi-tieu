import { NextResponse } from "next/server";
import { prisma } from "@/lib/server/db";

export async function GET() {
  try {
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
    return NextResponse.json({ success: true, message: "loan_payments table created" });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
