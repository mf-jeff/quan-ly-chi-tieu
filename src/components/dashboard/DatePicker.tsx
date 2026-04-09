"use client";

import { useState, useRef, useEffect } from "react";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  CalendarRange,
} from "lucide-react";
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addDays,
  isSameMonth,
  isSameDay,
  addMonths,
  subMonths,
  isWithinInterval,
  isBefore,
} from "date-fns";
import { vi } from "date-fns/locale";
import { useDateStore, type DateMode } from "@/lib/date-store";
import { useT } from "@/lib/i18n";

const monthNamesVi = ["Thg 1","Thg 2","Thg 3","Thg 4","Thg 5","Thg 6","Thg 7","Thg 8","Thg 9","Thg 10","Thg 11","Thg 12"];
const monthNamesEn = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const dayLabelsVi = ["CN","T2","T3","T4","T5","T6","T7"];
const dayLabelsEn = ["Su","Mo","Tu","We","Th","Fr","Sa"];

function getLang(): string {
  if (typeof window === "undefined") return "vi";
  try { const s = localStorage.getItem("app-language"); if (s) return JSON.parse(s).code; } catch {}
  return "vi";
}

type Tab = "day" | "month" | "range" | "year";

export default function DatePicker() {
  const { mode, startDate, endDate, setDay, setMonth, setYear, setRange } = useDateStore();
  const t = useT();
  const lang = getLang();
  const monthNames = lang === "en" ? monthNamesEn : monthNamesVi;
  const dayLabels = lang === "en" ? dayLabelsEn : dayLabelsVi;
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<Tab>(mode);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [yearRangeStart, setYearRangeStart] = useState(2020);

  // Range selection state
  const [rangeStart, setRangeStart] = useState<Date | null>(null);
  const [rangeEnd, setRangeEnd] = useState<Date | null>(null);
  const [hoverDate, setHoverDate] = useState<Date | null>(null);

  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function getDisplayText(): string {
    switch (mode) {
      case "day":
        return format(startDate, "dd/MM/yyyy", { locale: vi });
      case "month":
        return format(startDate, "MMMM yyyy", { locale: vi });
      case "year":
        return `Năm ${format(startDate, "yyyy")}`;
      case "range":
        return `${format(startDate, "dd/MM")} - ${format(endDate, "dd/MM/yyyy")}`;
    }
  }

  function handleSelectDay(day: Date) {
    if (tab === "range") {
      if (!rangeStart || (rangeStart && rangeEnd)) {
        setRangeStart(day);
        setRangeEnd(null);
      } else {
        const start = isBefore(day, rangeStart) ? day : rangeStart;
        const end = isBefore(day, rangeStart) ? rangeStart : day;
        setRangeStart(start);
        setRangeEnd(end);
        setRange(start, end);
      }
    } else {
      setDay(day);
    }
  }

  function handleSelectMonth(monthIndex: number) {
    const year = currentMonth.getFullYear();
    setMonth(monthIndex, year);
    setCurrentMonth(new Date(year, monthIndex, 1));
    setOpen(false);
  }

  function handleSelectYear(year: number) {
    setYear(year);
    setCurrentMonth(new Date(year, currentMonth.getMonth(), 1));
    setOpen(false);
  }

  function isInRange(day: Date): boolean {
    if (tab !== "range") return false;
    const start = rangeStart;
    const end = rangeEnd || hoverDate;
    if (!start || !end) return false;
    const actualStart = isBefore(end, start) ? end : start;
    const actualEnd = isBefore(end, start) ? start : end;
    return isWithinInterval(day, { start: actualStart, end: actualEnd });
  }

  function isRangeEdge(day: Date): boolean {
    if (!rangeStart) return false;
    if (isSameDay(day, rangeStart)) return true;
    if (rangeEnd && isSameDay(day, rangeEnd)) return true;
    return false;
  }

  function renderDayView() {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(monthStart);
    const calStart = startOfWeek(monthStart, { weekStartsOn: 0 });
    const calEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });

    const days: Date[] = [];
    let day = calStart;
    while (day <= calEnd) {
      days.push(day);
      day = addDays(day, 1);
    }

    return (
      <div>
        <div className="flex items-center justify-between mb-3">
          <button
            onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
            className="p-1 hover:bg-muted-bg rounded-lg transition-colors"
          >
            <ChevronLeft className="w-4 h-4 text-muted" />
          </button>
          <span className="text-sm font-semibold text-card-foreground">
            {format(currentMonth, "MMMM yyyy", { locale: vi })}
          </span>
          <button
            onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
            className="p-1 hover:bg-muted-bg rounded-lg transition-colors"
          >
            <ChevronRight className="w-4 h-4 text-muted" />
          </button>
        </div>

        {tab === "range" && (
          <div className="text-xs text-center text-muted mb-2">
            {!rangeStart
              ? t("date.selectStart")
              : !rangeEnd
              ? t("date.selectEnd")
              : `${format(rangeStart, "dd/MM")} → ${format(rangeEnd, "dd/MM/yyyy")}`}
          </div>
        )}

        <div className="grid grid-cols-7 mb-1">
          {dayLabels.map((d) => (
            <div key={d} className="text-center text-xs font-medium text-muted py-1">
              {d}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-0.5">
          {days.map((d, i) => {
            const isCurrentMonth = isSameMonth(d, currentMonth);
            const isToday = isSameDay(d, new Date());
            const inRange = isInRange(d);
            const isEdge = isRangeEdge(d);
            const isSelected = tab !== "range" && isSameDay(d, startDate);

            return (
              <button
                key={i}
                onClick={() => handleSelectDay(d)}
                onMouseEnter={() => tab === "range" && setHoverDate(d)}
                className={`
                  h-8 text-xs rounded-lg transition-colors
                  ${!isCurrentMonth ? "text-muted/40" : "text-card-foreground"}
                  ${isSelected || isEdge ? "bg-primary text-white font-semibold" : ""}
                  ${inRange && !isEdge ? "bg-primary-light/20 text-primary-light" : ""}
                  ${!isSelected && !inRange && !isEdge ? "hover:bg-muted-bg" : ""}
                  ${isToday && !isSelected && !isEdge ? "border border-primary-light text-primary-light font-semibold" : ""}
                `}
              >
                {format(d, "d")}
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  function renderMonthView() {
    return (
      <div>
        <div className="flex items-center justify-between mb-3">
          <button
            onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear() - 1, 0, 1))}
            className="p-1 hover:bg-muted-bg rounded-lg transition-colors"
          >
            <ChevronLeft className="w-4 h-4 text-muted" />
          </button>
          <span className="text-sm font-semibold text-card-foreground">
            {currentMonth.getFullYear()}
          </span>
          <button
            onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear() + 1, 0, 1))}
            className="p-1 hover:bg-muted-bg rounded-lg transition-colors"
          >
            <ChevronRight className="w-4 h-4 text-muted" />
          </button>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {monthNames.map((name, i) => {
            const isSelected =
              mode === "month" &&
              startDate.getMonth() === i &&
              startDate.getFullYear() === currentMonth.getFullYear();
            const isCurrent =
              new Date().getMonth() === i &&
              new Date().getFullYear() === currentMonth.getFullYear();

            return (
              <button
                key={i}
                onClick={() => handleSelectMonth(i)}
                className={`
                  py-3 text-sm rounded-xl transition-colors
                  ${isSelected ? "bg-primary text-white font-semibold" : "hover:bg-muted-bg text-card-foreground"}
                  ${isCurrent && !isSelected ? "border border-primary-light text-primary-light font-semibold" : ""}
                `}
              >
                {name}
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  function renderYearView() {
    const years = Array.from({ length: 12 }, (_, i) => yearRangeStart + i);

    return (
      <div>
        <div className="flex items-center justify-between mb-3">
          <button
            onClick={() => setYearRangeStart(yearRangeStart - 12)}
            className="p-1 hover:bg-muted-bg rounded-lg transition-colors"
          >
            <ChevronLeft className="w-4 h-4 text-muted" />
          </button>
          <span className="text-sm font-semibold text-card-foreground">
            {yearRangeStart} - {yearRangeStart + 11}
          </span>
          <button
            onClick={() => setYearRangeStart(yearRangeStart + 12)}
            className="p-1 hover:bg-muted-bg rounded-lg transition-colors"
          >
            <ChevronRight className="w-4 h-4 text-muted" />
          </button>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {years.map((year) => {
            const isSelected = mode === "year" && startDate.getFullYear() === year;
            const isCurrent = new Date().getFullYear() === year;

            return (
              <button
                key={year}
                onClick={() => handleSelectYear(year)}
                className={`
                  py-3 text-sm rounded-xl transition-colors
                  ${isSelected ? "bg-primary text-white font-semibold" : "hover:bg-muted-bg text-card-foreground"}
                  ${isCurrent && !isSelected ? "border border-primary-light text-primary-light font-semibold" : ""}
                `}
              >
                {year}
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  const tabs: { key: Tab; label: string }[] = [
    { key: "day", label: t("date.day") },
    { key: "month", label: t("date.month") },
    { key: "range", label: t("date.range") },
    { key: "year", label: t("date.year") },
  ];

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 text-sm text-muted bg-card border border-border rounded-xl px-4 py-2 hover:border-primary-light/50 transition-colors"
      >
        {mode === "range" ? (
          <CalendarRange className="w-4 h-4" />
        ) : (
          <CalendarDays className="w-4 h-4" />
        )}
        <span className="capitalize">{getDisplayText()}</span>
        <ChevronDown className={`w-3.5 h-3.5 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 z-50 bg-card border border-border rounded-2xl shadow-xl p-4 w-80">
          {/* Tabs */}
          <div className="flex gap-1 mb-3 bg-muted-bg rounded-xl p-1">
            {tabs.map((t) => (
              <button
                key={t.key}
                onClick={() => {
                  setTab(t.key);
                  if (t.key === "range") {
                    setRangeStart(null);
                    setRangeEnd(null);
                  }
                }}
                className={`flex-1 text-xs font-medium py-1.5 rounded-lg transition-colors ${
                  tab === t.key
                    ? "bg-card text-card-foreground shadow-sm"
                    : "text-muted hover:text-card-foreground"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Content */}
          {(tab === "day" || tab === "range") && renderDayView()}
          {tab === "month" && renderMonthView()}
          {tab === "year" && renderYearView()}

          {/* Quick actions */}
          <div className="flex flex-wrap gap-1.5 mt-3 pt-3 border-t border-border">
            <button
              onClick={() => {
                const today = new Date();
                setDay(today);
                setCurrentMonth(today);
                setTab("day");
                setOpen(false);
              }}
              className="text-xs font-medium text-primary-light px-3 py-1.5 hover:bg-primary-light/10 rounded-lg transition-colors"
            >
              {t("date.today")}
            </button>
            <button
              onClick={() => {
                const now = new Date();
                setMonth(now.getMonth(), now.getFullYear());
                setTab("month");
                setOpen(false);
              }}
              className="text-xs font-medium text-primary-light px-3 py-1.5 hover:bg-primary-light/10 rounded-lg transition-colors"
            >
              {t("date.thisMonth")}
            </button>
            <button
              onClick={() => {
                setYear(new Date().getFullYear());
                setTab("year");
                setOpen(false);
              }}
              className="text-xs font-medium text-primary-light px-3 py-1.5 hover:bg-primary-light/10 rounded-lg transition-colors"
            >
              {t("date.thisYear")}
            </button>
            <button
              onClick={() => {
                const now = new Date();
                const start = new Date(now);
                start.setDate(start.getDate() - 7);
                setRange(start, now);
                setTab("range");
                setRangeStart(start);
                setRangeEnd(now);
                setOpen(false);
              }}
              className="text-xs font-medium text-primary-light px-3 py-1.5 hover:bg-primary-light/10 rounded-lg transition-colors"
            >
              {t("date.7days")}
            </button>
            <button
              onClick={() => {
                const now = new Date();
                const start = new Date(now);
                start.setDate(start.getDate() - 30);
                setRange(start, now);
                setTab("range");
                setRangeStart(start);
                setRangeEnd(now);
                setOpen(false);
              }}
              className="text-xs font-medium text-primary-light px-3 py-1.5 hover:bg-primary-light/10 rounded-lg transition-colors"
            >
              {t("date.30days")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
