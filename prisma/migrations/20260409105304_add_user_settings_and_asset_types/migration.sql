-- CreateTable
CREATE TABLE "asset_types" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user_id" TEXT NOT NULL,
    "type_key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "icon" TEXT NOT NULL DEFAULT 'Tag',
    "color" TEXT NOT NULL DEFAULT '#8b5cf6',
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "asset_types_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_users" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'VND',
    "language" TEXT NOT NULL DEFAULT 'vi',
    "total_budget" REAL NOT NULL DEFAULT 0,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);
INSERT INTO "new_users" ("created_at", "currency", "email", "id", "name", "password_hash", "updated_at") SELECT "created_at", "currency", "email", "id", "name", "password_hash", "updated_at" FROM "users";
DROP TABLE "users";
ALTER TABLE "new_users" RENAME TO "users";
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "asset_types_user_id_type_key_key" ON "asset_types"("user_id", "type_key");
