/** Prices are stored in som (KGS); visitors can view them in rubles, dollars or tenge. */
export const CURRENCIES = ["KGS", "RUB", "USD", "KZT"] as const;
export type Currency = (typeof CURRENCIES)[number];

/** Som per 1 unit of currency (Mossovet sell rates, 27.11.2026). Used until live rates load, and if they fail. */
export const FALLBACK_RATES: Record<Currency, number> = { KGS: 1, RUB: 1.081, USD: 87.8, KZT: 0.204 };

/** Page with exchange rates of the Mossovet exchange offices in Bishkek. */
export const AKCHABAR_URL = "https://www.akchabar.kg/currency-rate";

/** Reads the Mossovet "sell" column (usd_sell_rate, rub_sell_rate, kzt_sell_rate) from the akchabar.kg page data. */
export function parseAkchabarMossovet(page: string): Partial<Record<Currency, number>> {
  const s = page.replace(/\\"/g, '"');
  const start = s.indexOf('"rate_from":"mossovet"');
  if (start < 0) return {};
  const next = s.indexOf('"rate_from"', start + 10);
  const block = s.slice(start, next > 0 ? next : start + 3000);
  const out: Partial<Record<Currency, number>> = {};
  for (const [code, key] of [["USD", "usd"], ["RUB", "rub"], ["KZT", "kzt"]] as const) {
    const m = block.match(new RegExp(`"${key}_sell_rate":([\\d.]+)`));
    const v = m ? parseFloat(m[1]) : 0;
    if (v > 0) out[code] = v;
  }
  return out;
}

const STEP: Record<Currency, number> = { KGS: 1, RUB: 10, USD: 1, KZT: 100 };
const SIGN: Record<Exclude<Currency, "KGS">, string> = { RUB: "₽", USD: "$", KZT: "₸" };

const group = (n: number) => n.toLocaleString("ru-RU").replace(/\s/g, " ");

/** "1 500 сом", "1 390 ₽", "$17", "8 900 ₸". `somWord` is the localized word for som. */
export function formatMoney(som: number, cur: Currency, rates: Record<Currency, number>, somWord: string): string {
  if (cur === "KGS") return `${group(som)} ${somWord}`;
  const step = STEP[cur];
  const v = Math.max(step, Math.round(som / rates[cur] / step) * step);
  return cur === "USD" ? `$${group(v)}` : `${group(v)} ${SIGN[cur]}`;
}
