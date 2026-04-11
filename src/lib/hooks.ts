"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { transactionApi, categoryApi, budgetApi, savingsApi, userSettingsApi, assetTypeApi, loanApi, payerApi, statisticsApi } from "./api";
import { useDateStore } from "./date-store";
import { toast } from "sonner";

// --- Transactions ---

export function useTransactions(params?: Record<string, string>) {
  const { startDate, endDate } = useDateStore();
  const finalParams = {
    ...(params?.startDate ? {} : { startDate: startDate.toISOString(), endDate: endDate.toISOString() }),
    ...params,
  };
  return useQuery({
    queryKey: ["transactions", finalParams],
    queryFn: () => transactionApi.list(finalParams),
  });
}

export function useAddTransaction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: transactionApi.create,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["transactions"] });
      qc.invalidateQueries({ queryKey: ["budgets"] });
      toast.success("Đã thêm giao dịch");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useDeleteTransaction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: transactionApi.delete,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["transactions"] });
      qc.invalidateQueries({ queryKey: ["budgets"] });
      toast.success("Đã xóa giao dịch");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

// --- Categories ---

export function useCategories() {
  return useQuery({
    queryKey: ["categories"],
    queryFn: () => categoryApi.list(),
    staleTime: 0,
  });
}

export function useAddCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: categoryApi.create,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["categories"] });
      toast.success("Đã thêm danh mục");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useDeleteCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => categoryApi.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["categories"] });
      toast.success("Đã xóa danh mục");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

// --- Budgets ---

export function useBudgets(month?: number, year?: number) {
  const { startDate } = useDateStore();
  const m = month || startDate.getMonth() + 1;
  const y = year || startDate.getFullYear();
  return useQuery({
    queryKey: ["budgets", m, y],
    queryFn: () => budgetApi.list(m, y),
    staleTime: 0,
  });
}

export function useUpsertBudget() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: budgetApi.upsert,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["budgets"] });
      toast.success("Đã cập nhật ngân sách");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

// --- Savings ---

export function useSavings(type?: string) {
  return useQuery({
    queryKey: ["savings", type],
    queryFn: () => savingsApi.list(type),
    staleTime: 0,
  });
}

export function useAddSavingsItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: savingsApi.create,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["savings"] });
      toast.success("Đã thêm thành công");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useUpdateSavingsItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) => savingsApi.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["savings"] });
      toast.success("Đã cập nhật");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useDeleteSavingsItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: savingsApi.delete,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["savings"] });
      toast.success("Đã xóa");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

// --- Loans ---

export function useLoans() {
  return useQuery({ queryKey: ["loans"], queryFn: () => loanApi.list(), staleTime: 0 });
}

export function useAddLoan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: loanApi.create,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["loans"] }); toast.success("Đã thêm khoản vay"); },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useUpdateLoan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) => loanApi.update(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["loans"] }); toast.success("Đã cập nhật"); },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useDeleteLoan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: loanApi.delete,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["loans"] }); toast.success("Đã xóa"); },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useAddLoanPayment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ loanId, data }: { loanId: string; data: { amount: number; note?: string; date?: string } }) =>
      loanApi.addPayment(loanId, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["loans"] }); toast.success("Đã ghi nhận"); },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useUpdateLoanPayment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ loanId, paymentId, data }: { loanId: string; paymentId: string; data: Record<string, unknown> }) =>
      loanApi.updatePayment(loanId, paymentId, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["loans"] }); toast.success("Đã cập nhật"); },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useDeleteLoanPayment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ loanId, paymentId }: { loanId: string; paymentId: string }) =>
      loanApi.deletePayment(loanId, paymentId),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["loans"] }); toast.success("Đã xóa"); },
    onError: (e: Error) => toast.error(e.message),
  });
}

// --- Payers ---

export function usePayers() {
  return useQuery({ queryKey: ["payers"], queryFn: payerApi.list });
}

export function useAddPayer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: payerApi.create,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["payers"] }); toast.success("Đã thêm"); },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useUpdatePayer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: { name?: string; color?: string } }) => payerApi.update(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["payers"] }); toast.success("Đã cập nhật"); },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useDeletePayer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: payerApi.delete,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["payers"] }); toast.success("Đã xóa"); },
    onError: (e: Error) => toast.error(e.message),
  });
}

// --- Statistics ---

export function useMonthComparison(month: number, year: number, compareMonth?: number, compareYear?: number) {
  return useQuery({
    queryKey: ["comparison", month, year, compareMonth, compareYear],
    queryFn: () => statisticsApi.compare(month, year, compareMonth, compareYear),
  });
}

// --- User Settings ---

export function useUserSettings() {
  return useQuery({
    queryKey: ["userSettings"],
    queryFn: () => userSettingsApi.get(),
    staleTime: 0,
  });
}

export function useUpdateUserSettings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: userSettingsApi.update,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["userSettings"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

// --- Asset Types ---

export function useAssetTypes() {
  return useQuery({
    queryKey: ["assetTypes"],
    queryFn: () => assetTypeApi.list(),
    staleTime: 0,
  });
}

export function useAddAssetType() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: assetTypeApi.create,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["assetTypes"] });
      toast.success("Đã thêm loại tài sản");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useDeleteAssetType() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: assetTypeApi.delete,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["assetTypes"] });
      toast.success("Đã xóa");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}
