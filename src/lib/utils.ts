import { VN_TIMEZONE } from "./constants";
export { VN_TIMEZONE };

export function nowVN(): Date {
  return new Date(
    new Date().toLocaleString("en-US", { timeZone: VN_TIMEZONE })
  );
}

export function formatDateVN(date: Date | string, options?: Intl.DateTimeFormatOptions): string {
  if (options) {
    return new Intl.DateTimeFormat("vi-VN", { timeZone: VN_TIMEZONE, ...options }).format(new Date(date));
  }
  // Default: DD/MM/YYYY
  const d = new Date(new Date(date).toLocaleString("en-US", { timeZone: VN_TIMEZONE }));
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

export function formatDateShort(date: Date | string): string {
  const d = new Date(new Date(date).toLocaleString("en-US", { timeZone: VN_TIMEZONE }));
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  return `${dd}/${mm}`;
}

export function formatDateTimeVN(date: Date | string): string {
  const d = new Date(new Date(date).toLocaleString("en-US", { timeZone: VN_TIMEZONE }));
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  const hh = String(d.getHours()).padStart(2, "0");
  const min = String(d.getMinutes()).padStart(2, "0");
  return `${dd}/${mm}/${yyyy} ${hh}:${min}`;
}

export function toVNISOString(date: Date): string {
  // Convert to VN timezone and return ISO-like string for datetime-local input
  const vnDate = new Date(date.toLocaleString("en-US", { timeZone: VN_TIMEZONE }));
  const y = vnDate.getFullYear();
  const m = String(vnDate.getMonth() + 1).padStart(2, "0");
  const d = String(vnDate.getDate()).padStart(2, "0");
  const h = String(vnDate.getHours()).padStart(2, "0");
  const min = String(vnDate.getMinutes()).padStart(2, "0");
  return `${y}-${m}-${d}T${h}:${min}`;
}

export function formatVND(amount: number): string {
  if (typeof window !== "undefined") {
    try {
      const saved = localStorage.getItem("app-currency");
      if (saved) {
        const c = JSON.parse(saved);
        // Exchange rates from VND
        const rates: Record<string, number> = {
          VND: 1, USD: 1/25_450,
        };
        const converted = amount * (rates[c.code] || 1);
        const noDecimals = ["VND", "KRW", "JPY"].includes(c.code);
        return new Intl.NumberFormat(c.locale, {
          style: "currency",
          currency: c.code,
          maximumFractionDigits: noDecimals ? 0 : 2,
        }).format(converted);
      }
    } catch { /* fallback */ }
  }
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(amount);
}

export function formatShortVND(amount: number): string {
  if (amount >= 1_000_000_000) {
    return `${(amount / 1_000_000_000).toFixed(1)} tỷ`;
  }
  if (amount >= 1_000_000) {
    return `${(amount / 1_000_000).toFixed(1)} tr`;
  }
  if (amount >= 1_000) {
    return `${(amount / 1_000).toFixed(0)}k`;
  }
  return amount.toString();
}

export const categoryLabels: Record<string, string> = {
  food: "Ăn uống",
  transport: "Di chuyển",
  shopping: "Mua sắm",
  entertainment: "Giải trí",
  bills: "Hóa đơn",
  health: "Sức khỏe",
  education: "Giáo dục",
  salary: "Lương",
  freelance: "Thu nhập phụ",
  investment: "Đầu tư",
  other: "Khác",
};

export const categoryColors: Record<string, string> = {
  food: "#ef4444",
  transport: "#3b82f6",
  shopping: "#f59e0b",
  entertainment: "#8b5cf6",
  bills: "#06b6d4",
  health: "#10b981",
  education: "#f97316",
  salary: "#22c55e",
  freelance: "#14b8a6",
  investment: "#6366f1",
  other: "#94a3b8",
};
