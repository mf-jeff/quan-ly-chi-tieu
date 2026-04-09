// @ts-nocheck
// This file is run manually: node prisma/seed.mjs
// Not included in Next.js build

import pkg from "@prisma/client";
const { PrismaClient } = pkg;
import bcryptjs from "bcryptjs";
const { hashSync } = bcryptjs;

const prisma = new PrismaClient();

const categories = [
  { name: "Ăn uống", icon: "Utensils", color: "#ef4444", type: "expense" },
  { name: "Di chuyển", icon: "Car", color: "#3b82f6", type: "expense" },
  { name: "Mua sắm", icon: "ShoppingBag", color: "#f59e0b", type: "expense" },
  { name: "Giải trí", icon: "Gamepad2", color: "#8b5cf6", type: "expense" },
  { name: "Hóa đơn", icon: "Receipt", color: "#06b6d4", type: "expense" },
  { name: "Sức khỏe", icon: "Heart", color: "#10b981", type: "expense" },
  { name: "Giáo dục", icon: "GraduationCap", color: "#f97316", type: "expense" },
  { name: "Lương", icon: "Banknote", color: "#22c55e", type: "income" },
  { name: "Thu nhập phụ", icon: "Briefcase", color: "#14b8a6", type: "income" },
  { name: "Đầu tư", icon: "TrendingUp", color: "#6366f1", type: "both" },
  { name: "Khác", icon: "MoreHorizontal", color: "#94a3b8", type: "both" },
];

async function main() {
  const user = await prisma.user.upsert({
    where: { email: "demo@vault.vn" },
    update: {},
    create: {
      email: "demo@vault.vn",
      name: "Demo User",
      passwordHash: hashSync("demo123", 10),
    },
  });
  console.log("Created user:", user.email);

  const cats = {};
  for (const cat of categories) {
    const c = await prisma.category.upsert({
      where: { userId_name: { userId: user.id, name: cat.name } },
      update: {},
      create: { ...cat, userId: user.id, isDefault: true },
    });
    cats[cat.name] = c.id;
  }
  console.log("Created", Object.keys(cats).length, "categories");

  const txData = [
    { type: "expense", cat: "Ăn uống", amount: 85000, note: "Cơm trưa", days: 0 },
    { type: "expense", cat: "Di chuyển", amount: 45000, note: "Grab", days: 0 },
    { type: "income", cat: "Lương", amount: 25000000, note: "Lương tháng", days: 4 },
    { type: "expense", cat: "Mua sắm", amount: 350000, note: "Áo thun", days: 1 },
    { type: "expense", cat: "Hóa đơn", amount: 1500000, note: "Tiền điện", days: 2 },
  ];

  const now = new Date();
  for (const tx of txData) {
    const date = new Date(now);
    date.setDate(date.getDate() - tx.days);
    await prisma.transaction.create({
      data: { userId: user.id, categoryId: cats[tx.cat], amount: tx.amount, type: tx.type, note: tx.note, date },
    });
  }
  console.log("Created", txData.length, "transactions");
  console.log("\nDemo: demo@vault.vn / demo123");
}

main().catch(console.error).finally(() => prisma.$disconnect());
