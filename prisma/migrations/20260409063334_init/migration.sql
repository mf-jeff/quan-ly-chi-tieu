-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'VND',
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "categories" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "color" TEXT NOT NULL DEFAULT '#3b82f6',
    "icon" TEXT NOT NULL DEFAULT 'Tag',
    "type" TEXT NOT NULL DEFAULT 'expense',
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "categories_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "transactions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user_id" TEXT NOT NULL,
    "category_id" TEXT NOT NULL,
    "amount" REAL NOT NULL,
    "type" TEXT NOT NULL,
    "note" TEXT NOT NULL DEFAULT '',
    "date" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "currency" TEXT NOT NULL DEFAULT 'VND',
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "transactions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "transactions_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "categories" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "budgets" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user_id" TEXT NOT NULL,
    "category_id" TEXT NOT NULL,
    "amount" REAL NOT NULL,
    "month" INTEGER NOT NULL,
    "year" INTEGER NOT NULL,
    CONSTRAINT "budgets_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "budgets_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "categories" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "recurring_transactions" (
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
    CONSTRAINT "recurring_transactions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "categories_user_id_name_key" ON "categories"("user_id", "name");

-- CreateIndex
CREATE INDEX "transactions_user_id_date_idx" ON "transactions"("user_id", "date");

-- CreateIndex
CREATE INDEX "transactions_user_id_category_id_idx" ON "transactions"("user_id", "category_id");

-- CreateIndex
CREATE UNIQUE INDEX "budgets_user_id_category_id_month_year_key" ON "budgets"("user_id", "category_id", "month", "year");
