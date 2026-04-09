import { PrismaClient } from "@prisma/client";
import { hashSync } from "bcryptjs";

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
  // Create demo user
  const user = await prisma.user.upsert({
    where: { email: "demo@spendwise.vn" },
    update: {},
    create: {
      email: "demo@spendwise.vn",
      name: "Demo User",
      passwordHash: hashSync("demo123", 10),
    },
  });

  console.log("Created user:", user.email);

  // Create categories
  const cats: Record<string, string> = {};
  for (const cat of categories) {
    const c = await prisma.category.upsert({
      where: { userId_name: { userId: user.id, name: cat.name } },
      update: {},
      create: { ...cat, userId: user.id, isDefault: true },
    });
    cats[cat.name] = c.id;
  }
  console.log("Created", Object.keys(cats).length, "categories");

  // Create sample transactions
  const txData = [
    { type: "expense", cat: "Ăn uống", amount: 85000, note: "Cơm trưa văn phòng", days: 0 },
    { type: "expense", cat: "Di chuyển", amount: 45000, note: "Grab đi làm", days: 0 },
    { type: "income", cat: "Lương", amount: 25000000, note: "Lương tháng 4", days: 4 },
    { type: "expense", cat: "Mua sắm", amount: 350000, note: "Áo thun Uniqlo", days: 1 },
    { type: "expense", cat: "Hóa đơn", amount: 1500000, note: "Tiền điện tháng 3", days: 2 },
    { type: "expense", cat: "Giải trí", amount: 200000, note: "Xem phim CGV", days: 3 },
    { type: "expense", cat: "Sức khỏe", amount: 500000, note: "Khám bệnh", days: 5 },
    { type: "income", cat: "Thu nhập phụ", amount: 5000000, note: "Dự án thiết kế logo", days: 6 },
    { type: "expense", cat: "Giáo dục", amount: 800000, note: "Khóa học Udemy", days: 7 },
    { type: "expense", cat: "Ăn uống", amount: 120000, note: "Cafe Highland", days: 8 },
    { type: "expense", cat: "Ăn uống", amount: 65000, note: "Phở sáng", days: 1 },
    { type: "expense", cat: "Di chuyển", amount: 30000, note: "Xăng xe máy", days: 3 },
    { type: "expense", cat: "Mua sắm", amount: 1200000, note: "Giày Nike", days: 5 },
    { type: "expense", cat: "Ăn uống", amount: 150000, note: "Nhậu cuối tuần", days: 2 },
    { type: "income", cat: "Thu nhập phụ", amount: 3000000, note: "Viết bài freelance", days: 9 },
  ];

  const now = new Date();
  for (const tx of txData) {
    const date = new Date(now);
    date.setDate(date.getDate() - tx.days);
    await prisma.transaction.create({
      data: {
        userId: user.id,
        categoryId: cats[tx.cat],
        amount: tx.amount,
        type: tx.type,
        note: tx.note,
        date,
      },
    });
  }
  console.log("Created", txData.length, "transactions");

  // Create budgets for current month
  const budgetData = [
    { cat: "Ăn uống", amount: 3000000 },
    { cat: "Di chuyển", amount: 1500000 },
    { cat: "Mua sắm", amount: 2000000 },
    { cat: "Giải trí", amount: 1000000 },
    { cat: "Hóa đơn", amount: 3000000 },
    { cat: "Sức khỏe", amount: 1000000 },
    { cat: "Giáo dục", amount: 1500000 },
  ];

  for (const b of budgetData) {
    await prisma.budget.upsert({
      where: {
        userId_categoryId_month_year: {
          userId: user.id,
          categoryId: cats[b.cat],
          month: now.getMonth() + 1,
          year: now.getFullYear(),
        },
      },
      update: { amount: b.amount },
      create: {
        userId: user.id,
        categoryId: cats[b.cat],
        amount: b.amount,
        month: now.getMonth() + 1,
        year: now.getFullYear(),
      },
    });
  }
  console.log("Created", budgetData.length, "budgets");

  console.log("\n--- Demo Account ---");
  console.log("Email: demo@spendwise.vn");
  console.log("Password: demo123");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
