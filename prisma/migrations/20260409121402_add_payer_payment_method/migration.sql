-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_transactions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user_id" TEXT NOT NULL,
    "category_id" TEXT NOT NULL,
    "amount" REAL NOT NULL,
    "type" TEXT NOT NULL,
    "note" TEXT NOT NULL DEFAULT '',
    "payer" TEXT NOT NULL DEFAULT '',
    "payment_method" TEXT NOT NULL DEFAULT 'cash',
    "date" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "currency" TEXT NOT NULL DEFAULT 'VND',
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "transactions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "transactions_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "categories" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_transactions" ("amount", "category_id", "created_at", "currency", "date", "id", "note", "type", "user_id") SELECT "amount", "category_id", "created_at", "currency", "date", "id", "note", "type", "user_id" FROM "transactions";
DROP TABLE "transactions";
ALTER TABLE "new_transactions" RENAME TO "transactions";
CREATE INDEX "transactions_user_id_date_idx" ON "transactions"("user_id", "date");
CREATE INDEX "transactions_user_id_category_id_idx" ON "transactions"("user_id", "category_id");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
