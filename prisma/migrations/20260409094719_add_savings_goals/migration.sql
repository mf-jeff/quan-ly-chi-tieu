-- CreateTable
CREATE TABLE "savings_goals" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "target_amount" REAL NOT NULL,
    "saved_amount" REAL NOT NULL DEFAULT 0,
    "icon" TEXT NOT NULL DEFAULT 'PiggyBank',
    "color" TEXT NOT NULL DEFAULT '#10b981',
    "deadline" DATETIME,
    "is_completed" BOOLEAN NOT NULL DEFAULT false,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "savings_goals_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
