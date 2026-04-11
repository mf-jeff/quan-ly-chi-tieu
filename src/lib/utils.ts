import { VN_TIMEZONE } from "./constants";
export { VN_TIMEZONE };

/** Safe arithmetic expression parser — supports +, -, *, /, () only */
export function safeEvalExpr(expr: string): number {
  const cleaned = expr.replace(/[^0-9+\-*/().]/g, "");
  if (!cleaned) return 0;
  // Validate: only digits, operators, parens, dots
  if (!/^[0-9+\-*/().]+$/.test(cleaned)) return 0;
  // Reject empty parens or double operators
  if (/\(\)/.test(cleaned) || /[+\-*/]{2,}/.test(cleaned.replace(/[()]/g, ""))) return 0;

  // Recursive descent parser
  let pos = 0;
  function peek() { return cleaned[pos]; }
  function next() { return cleaned[pos++]; }

  function parseNum(): number {
    if (peek() === "(") { next(); const v = parseExpr(); next(); return v; }
    if (peek() === "-") { next(); return -parseNum(); }
    let s = "";
    while (pos < cleaned.length && /[0-9.]/.test(peek())) s += next();
    return parseFloat(s) || 0;
  }

  function parseTerm(): number {
    let v = parseNum();
    while (pos < cleaned.length && (peek() === "*" || peek() === "/")) {
      const op = next();
      const r = parseNum();
      v = op === "*" ? v * r : r !== 0 ? v / r : 0;
    }
    return v;
  }

  function parseExpr(): number {
    let v = parseTerm();
    while (pos < cleaned.length && (peek() === "+" || peek() === "-")) {
      const op = next();
      v = op === "+" ? v + parseTerm() : v - parseTerm();
    }
    return v;
  }

  try { return parseExpr(); } catch { return 0; }
}

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
