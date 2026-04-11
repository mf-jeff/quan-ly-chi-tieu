import { create } from "zustand";

export interface Currency {
  code: string;
  symbol: string;
  name: string;
  locale: string;
}

export interface Language {
  code: string;
  name: string;
  flag: string;
}

export const currencies: Currency[] = [
  { code: "VND", symbol: "₫", name: "Việt Nam Đồng", locale: "vi-VN" },
  { code: "USD", symbol: "$", name: "US Dollar", locale: "en-US" },
];

export const languages: Language[] = [
  { code: "vi", name: "Tiếng Việt", flag: "🇻🇳" },
  { code: "en", name: "English", flag: "🇺🇸" },
];

const ratesFromVND: Record<string, number> = {
  VND: 1,
  USD: 1 / 25_450,
};

export function convertFromVND(amountVND: number, toCurrency: string): number {
  const rate = ratesFromVND[toCurrency] || 1;
  return amountVND * rate;
}

interface SettingsStore {
  currency: Currency;
  language: Language;
  setCurrency: (code: string) => void;
  setLanguage: (code: string) => void;
}

function loadSetting<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const saved = localStorage.getItem(key);
    return saved ? JSON.parse(saved) : fallback;
  } catch {
    return fallback;
  }
}

export const useSettings = create<SettingsStore>((set, get) => ({
  currency: loadSetting("app-currency", currencies[0]),
  language: loadSetting("app-language", languages[0]),

  setCurrency: (code) => {
    const c = currencies.find((x) => x.code === code);
    if (c) {
      localStorage.setItem("app-currency", JSON.stringify(c));
      set({ currency: c });
    }
  },

  setLanguage: (code) => {
    const l = languages.find((x) => x.code === code);
    if (l) {
      localStorage.setItem("app-language", JSON.stringify(l));
      set({ language: l });
    }
  },

}));
