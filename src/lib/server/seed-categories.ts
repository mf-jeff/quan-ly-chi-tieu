import { prisma } from "./db";

const defaultCategories = [
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

export async function seedDefaultCategories(userId: string) {
  const existing = await prisma.category.count({ where: { userId } });
  if (existing > 0) return;

  await prisma.category.createMany({
    data: defaultCategories.map((c) => ({
      ...c,
      userId,
      isDefault: true,
    })),
  });
}
