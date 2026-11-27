import { NextResponse } from "next/server";
import { AKCHABAR_URL, FALLBACK_RATES, parseAkchabarMossovet } from "@/lib/currency";

/**
 * Exchange rates for showing prices in other currencies: the Mossovet "sell" column
 * from akchabar.kg, som per unit. The page is cached at Cloudflare's edge for 6 hours,
 * so the rates refresh several times a day; if the page fails, built-in rates are used.
 */
export async function GET() {
  let rates: Record<string, number> = { ...FALLBACK_RATES };
  let source = "fallback";
  try {
    const res = await fetch(AKCHABAR_URL, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; IssykkulBiz/1.0)", Accept: "text/html" },
      signal: AbortSignal.timeout(5000),
      cf: { cacheTtl: 6 * 3600, cacheEverything: true },
    } as RequestInit);
    if (res.ok) {
      const parsed = parseAkchabarMossovet(await res.text());
      if (parsed.USD && parsed.RUB && parsed.KZT) {
        rates = { ...rates, ...parsed };
        source = "akchabar-mossovet";
      }
    }
  } catch {}
  return NextResponse.json({ rates, source }, { headers: { "Cache-Control": "public, max-age=3600" } });
}
