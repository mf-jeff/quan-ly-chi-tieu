/*
  Warnings:

  - You are about to drop the `savings_goals` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "savings_goals";
PRAGMA foreign_keys=on;

-- CreateTable
CREATE TABLE "savings_items" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user_id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "amount" REAL NOT NULL,
    "interest_rate" REAL,
    "start_date" DATETIME,
    "maturity_date" DATETIME,
    "term_months" INTEGER,
    "gold_unit" REAL,
    "gold_type" TEXT,
    "buy_price" REAL,
    "note" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "savings_items_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "savings_items_user_id_type_idx" ON "savings_items"("user_id", "type");
