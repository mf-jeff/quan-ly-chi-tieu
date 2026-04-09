-- Vault Database Schema for Turso

CREATE TABLE IF NOT EXISTS "users" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'VND',
    "language" TEXT NOT NULL DEFAULT 'vi',
    "total_budget" REAL NOT NULL DEFAULT 0,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "categories" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "color" TEXT NOT NULL DEFAULT '#3b82f6',
    "icon" TEXT NOT NULL DEFAULT 'Tag',
    "type" TEXT NOT NULL DEFAULT 'expense',
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS "transactions" (
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
    FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE,
    FOREIGN KEY ("category_id") REFERENCES "categories" ("id")
);

CREATE TABLE IF NOT EXISTS "budgets" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user_id" TEXT NOT NULL,
    "category_id" TEXT NOT NULL,
    "amount" REAL NOT NULL,
    "month" INTEGER NOT NULL,
    "year" INTEGER NOT NULL,
    FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE,
    FOREIGN KEY ("category_id") REFERENCES "categories" ("id")
);

CREATE TABLE IF NOT EXISTS "savings_items" (
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
    "current_price" REAL,
    "note" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS "asset_types" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user_id" TEXT NOT NULL,
    "type_key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "icon" TEXT NOT NULL DEFAULT 'Tag',
    "color" TEXT NOT NULL DEFAULT '#8b5cf6',
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS "recurring_transactions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user_id" TEXT NOT NULL,
    "category_id" TEXT NOT NULL,
    "amount" REAL NOT NULL,
    "type" TEXT NOT NULL,
    "note" TEXT NOT NULL DEFAULT '',
    "frequency" TEXT NOT NULL,
    "next_run_date" DATETIME NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE
);

-- Indexes
CREATE UNIQUE INDEX IF NOT EXISTS "users_email_key" ON "users"("email");
CREATE UNIQUE INDEX IF NOT EXISTS "categories_user_id_name_key" ON "categories"("user_id", "name");
CREATE INDEX IF NOT EXISTS "transactions_user_id_date_idx" ON "transactions"("user_id", "date");
CREATE INDEX IF NOT EXISTS "transactions_user_id_category_id_idx" ON "transactions"("user_id", "category_id");
CREATE UNIQUE INDEX IF NOT EXISTS "budgets_user_id_category_id_month_year_key" ON "budgets"("user_id", "category_id", "month", "year");
CREATE INDEX IF NOT EXISTS "savings_items_user_id_type_idx" ON "savings_items"("user_id", "type");
CREATE UNIQUE INDEX IF NOT EXISTS "asset_types_user_id_type_key_key" ON "asset_types"("user_id", "type_key");
