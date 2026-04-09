"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { transactionApi, categoryApi, budgetApi, savingsApi, userSettingsApi, assetTypeApi } from "./api";
import { useDateStore } from "./date-store";
import { toast } from "sonner";

// --- Transactions ---

export function useTransactions(params?: Record<string, string>) {
  const { startDate, endDate } = useDateStore();
  // If params already has startDate/endDate, use those (page-level filter)
  // Otherwise use the global date store (dashboard-level filter)
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
