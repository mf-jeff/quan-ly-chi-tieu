import { NextResponse } from "next/server";

export async function GET() {
  let usdVnd: number | null = null;

  try {
    const res = await fetch("https://open.er-api.com/v6/latest/USD", {
      cache: "no-store",
    });
    if (res.ok) {
      const json = await res.json();
      usdVnd = json.rates?.VND || null;
    }
  } catch { /* fallback */ }

  return NextResponse.json({
    usdVnd,
    timestamp: new Date().toISOString(),
  });
}
