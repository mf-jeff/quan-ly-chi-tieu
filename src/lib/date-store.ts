import { create } from "zustand";
import { startOfMonth, endOfMonth, startOfDay, endOfDay } from "date-fns";
import { nowVN } from "./utils";

export type DateMode = "day" | "month" | "range" | "year";

interface DateStore {
  mode: DateMode;
  startDate: Date;
  endDate: Date;
  setDay: (date: Date) => void;
  setMonth: (month: number, year: number) => void;
  setYear: (year: number) => void;
  setRange: (start: Date, end: Date) => void;
}

const vnNow = nowVN();

export const useDateStore = create<DateStore>((set) => ({
  mode: "month",
  startDate: startOfMonth(vnNow),
  endDate: endOfMonth(vnNow),

  setDay: (date) =>
    set({
      mode: "day",
      startDate: startOfDay(date),
      endDate: endOfDay(date),
    }),

  setMonth: (month, year) =>
    set({
      mode: "month",
      startDate: startOfMonth(new Date(year, month, 1)),
      endDate: endOfMonth(new Date(year, month, 1)),
    }),

  setYear: (year) =>
    set({
      mode: "year",
      startDate: new Date(year, 0, 1),
      endDate: new Date(year, 11, 31, 23, 59, 59),
    }),

  setRange: (start, end) =>
    set({
      mode: "range",
      startDate: startOfDay(start),
      endDate: endOfDay(end),
    }),
}));
