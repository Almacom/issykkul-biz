"use client";
import { createContext, useContext, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { CURRENCIES, FALLBACK_RATES, formatMoney, type Currency } from "@/lib/currency";

type Ctx = { cur: Currency; setCur: (c: Currency) => void; rates: Record<Currency, number> };
const CurrencyCtx = createContext<Ctx>({ cur: "KGS", setCur: () => {}, rates: FALLBACK_RATES });

const KEY = "currency";
const RATES_KEY = "rates";
const TTL = 6 * 3600e3;

/** Pages render in som on the server; the visitor's choice is applied after load. */
export function CurrencyProvider({ children }: { children: React.ReactNode }) {
  const [cur, setCurState] = useState<Currency>("KGS");
  const [rates, setRates] = useState(FALLBACK_RATES);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(KEY) as Currency | null;
      if (saved && CURRENCIES.includes(saved)) setCurState(saved);
    } catch {}
  }, []);

  useEffect(() => {
    if (cur === "KGS") return;
    try {
      const c = JSON.parse(localStorage.getItem(RATES_KEY) ?? "null");
      if (c && Date.now() - c.at < TTL) {
        setRates(c.rates);
        return;
      }
    } catch {}
    fetch("/api/rates")
      .then((r) => r.json())
      .then((d) => {
        setRates(d.rates);
        try {
          localStorage.setItem(RATES_KEY, JSON.stringify({ at: Date.now(), rates: d.rates }));
        } catch {}
      })
      .catch(() => {});
  }, [cur]);

  const setCur = (c: Currency) => {
    setCurState(c);
    try {
      localStorage.setItem(KEY, c);
    } catch {}
  };
  return <CurrencyCtx.Provider value={{ cur, setCur, rates }}>{children}</CurrencyCtx.Provider>;
}

export function useMoney() {
  const { cur, rates } = useContext(CurrencyCtx);
  const t = useTranslations();
  return (som: number) => formatMoney(som, cur, rates, t("som"));
}

/** A price stored in som, shown in the visitor's currency. */
export function Money({ som }: { som: number }) {
  const fmt = useMoney();
  return <span className="money">{fmt(som)}</span>;
}

export function CurrencySwitch() {
  const { cur, setCur } = useContext(CurrencyCtx);
  const t = useTranslations("currency");
  return (
    <select className="cur-switch" value={cur} onChange={(e) => setCur(e.target.value as Currency)} aria-label={t("label")}>
      {CURRENCIES.map((c) => (
        <option key={c} value={c}>{t(c)}</option>
      ))}
    </select>
  );
}

/** Renders a translated phrase like "от {price}" with the price in the visitor's currency. */
export function FromPrice({ text, som }: { text: string; som: number }) {
  const [before, after = ""] = text.split("@@P@@");
  return <>{before}<Money som={som} />{after}</>;
}
