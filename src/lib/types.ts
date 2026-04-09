export type TransactionType = "income" | "expense";

export interface CategoryItem {
  id: string;
  name: string;
  icon: string; // lucide icon name
  color: string;
  type: TransactionType | "both";
}

export interface Transaction {
  id: string;
  type: TransactionType;
  categoryId: string;
  amount: number;
  description: string;
  date: string; // ISO date string
}

export interface CategorySummary {
  category: string;
  amount: number;
  percentage: number;
  color: string;
}

export interface BudgetItem {
  category: string;
  limit: number;
  spent: number;
}

export interface DailySpending {
  date: string;
  income: number;
  expense: number;
}

export interface SavingsItemData {
  id: string;
  type: "CASH" | "SAVINGS_BOOK" | "GOLD";
  name: string;
  amount: number;
  interestRate: number | null;
  startDate: string | null;
  maturityDate: string | null;
  termMonths: number | null;
  goldUnit: number | null;
  goldType: string | null;
  buyPrice: number | null;
  currentPrice: number | null;
  note: string | null;
  createdAt: string;
}
