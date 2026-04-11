const BASE = "/api";

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("token") || sessionStorage.getItem("token");
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  if (res.status === 401) {
    if (typeof window !== "undefined") {
      localStorage.removeItem("token");
      window.location.href = "/login";
    }
    throw new Error("Unauthorized");
  }

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || `HTTP ${res.status}`);
  }

  // Handle blob responses (export)
  const contentType = res.headers.get("content-type");
  if (contentType && !contentType.includes("application/json")) {
    return res.blob() as unknown as T;
  }

  return res.json();
}

// Auth
export const authApi = {
  register: (data: { email: string; password: string; name: string; inviteCode?: string }) =>
    request<{ token: string; user: { id: string; email: string; name: string } }>("/auth/register", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  login: (data: { email: string; password: string }) =>
    request<{ token: string; user: { id: string; email: string; name: string } }>("/auth/login", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  me: () =>
    request<{ user: { id: string; email: string; name: string; currency: string } }>("/auth/me"),
};

// Transactions
export const transactionApi = {
  list: (params?: Record<string, string>) => {
    const qs = params ? "?" + new URLSearchParams(params).toString() : "";
    return request<{
      transactions: Array<{
        id: string; amount: number; type: string; note: string;
        payer: string; paymentMethod: string;
        date: string; currency: string; categoryId: string;
        category: { id: string; name: string; color: string; icon: string };
      }>;
      pagination: { page: number; limit: number; total: number; totalPages: number };
      totals: { income: number; expense: number };
    }>(`/transactions${qs}`);
  },
  create: (data: { amount: number; type: string; categoryId: string; note?: string; payer?: string; paymentMethod?: string; date?: string }) =>
    request("/transactions", { method: "POST", body: JSON.stringify(data) }),
  update: (id: string, data: Record<string, unknown>) =>
    request(`/transactions/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  delete: (id: string) =>
    request(`/transactions/${id}`, { method: "DELETE" }),
};

// Categories
export const categoryApi = {
  list: () =>
    request<{
      categories: Array<{
        id: string; name: string; color: string; icon: string; type: string;
        _count: { transactions: number };
      }>;
    }>("/categories"),
  create: (data: { name: string; color?: string; icon?: string; type?: string }) =>
    request("/categories", { method: "POST", body: JSON.stringify(data) }),
  update: (id: string, data: Record<string, unknown>) =>
    request(`/categories/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  delete: (id: string, moveTo?: string) =>
    request(`/categories/${id}${moveTo ? `?moveTo=${moveTo}` : ""}`, { method: "DELETE" }),
};

// Budgets
export const budgetApi = {
  list: (month?: number, year?: number) => {
    const params = new URLSearchParams();
    if (month) params.set("month", month.toString());
    if (year) params.set("year", year.toString());
    return request<{
      budgets: Array<{
        id: string; categoryId: string; amount: number; month: number; year: number;
        spent: number; percentage: number;
        category: { id: string; name: string; color: string; icon: string };
      }>;
    }>(`/budgets?${params}`);
  },
  upsert: (data: { categoryId: string; amount: number; month?: number; year?: number }) =>
    request("/budgets", { method: "POST", body: JSON.stringify(data) }),
};

// Savings
import type { SavingsItemData } from "./types";
export type { SavingsItemData };

// User Settings
export const userSettingsApi = {
  get: () => request<{ settings: { currency: string; language: string; totalBudget: number } }>("/user/settings"),
  update: (data: { currency?: string; language?: string; totalBudget?: number }) =>
    request<{ settings: { currency: string; language: string; totalBudget: number } }>("/user/settings", { method: "PUT", body: JSON.stringify(data) }),
};

// Asset Types
export const assetTypeApi = {
  list: () => request<{ types: Array<{ id: string; typeKey: string; name: string; icon: string; color: string; isDefault: boolean }> }>("/asset-types"),
  create: (data: { name: string; icon?: string; color?: string }) =>
    request<{ type: { id: string; typeKey: string; name: string; icon: string; color: string; isDefault: boolean } }>("/asset-types", { method: "POST", body: JSON.stringify(data) }),
  delete: (id: string) => request<{ success: boolean }>(`/asset-types/${id}`, { method: "DELETE" }),
};

export const savingsApi = {
  list: (type?: string) => {
    const qs = type ? `?type=${type}` : "";
    return request<{
      success: boolean;
      data: SavingsItemData[];
      summary: { totalAssets: number; totalInterest: number; totalItems: number };
      goldSummary: { totalUnit: number; totalBuy: number; totalCurrent: number; profitLoss: number | null };
    }>(`/savings${qs}`);
  },
  create: (data: Record<string, unknown>) =>
    request<{ success: boolean; data: SavingsItemData }>("/savings", { method: "POST", body: JSON.stringify(data) }),
  update: (id: string, data: Record<string, unknown>) =>
    request<{ success: boolean; data: SavingsItemData }>(`/savings/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  delete: (id: string) =>
    request<{ success: boolean }>(`/savings/${id}`, { method: "DELETE" }),
};

// Loans
export interface LoanPaymentData {
  id: string; loanId: string; amount: number; note: string | null; date: string; createdAt: string;
}

export interface LoanData {
  id: string; type: string; lender: string; borrower: string; amount: number;
  paidAmount: number; interestRate: number | null; date: string; dueDate: string | null;
  isPaid: boolean; note: string | null; createdAt: string;
  payments: LoanPaymentData[];
}

export const loanApi = {
  list: () => request<{ loans: LoanData[]; totalLent: number; totalPaid: number }>("/loans"),
  create: (data: Record<string, unknown>) => request("/loans", { method: "POST", body: JSON.stringify(data) }),
  update: (id: string, data: Record<string, unknown>) => request(`/loans/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  delete: (id: string) => request(`/loans/${id}`, { method: "DELETE" }),
  addPayment: (loanId: string, data: { amount: number; note?: string; date?: string }) =>
    request<{ payment: LoanPaymentData; totalPaid: number }>(`/loans/${loanId}/payments`, { method: "POST", body: JSON.stringify(data) }),
  updatePayment: (loanId: string, paymentId: string, data: Record<string, unknown>) =>
    request<{ success: boolean; totalPaid: number }>(`/loans/${loanId}/payments/${paymentId}`, { method: "PUT", body: JSON.stringify(data) }),
  deletePayment: (loanId: string, paymentId: string) =>
    request<{ success: boolean; totalPaid: number }>(`/loans/${loanId}/payments/${paymentId}`, { method: "DELETE" }),
};

// Export
export const exportApi = {
  download: async (format: "xlsx" | "csv", startDate?: string, endDate?: string) => {
    const params = new URLSearchParams({ format });
    if (startDate) params.set("startDate", startDate);
    if (endDate) params.set("endDate", endDate);
    // Build filename from date
    let fileName = "giao-dich";
    if (startDate) {
      const d = new Date(startDate);
      fileName = `giao dich thang ${d.getMonth() + 1} nam ${d.getFullYear()}`;
    }

    const blob = await request<Blob>(`/export?${params}`);
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${fileName}.${format}`;
    a.click();
    URL.revokeObjectURL(url);
  },
};
