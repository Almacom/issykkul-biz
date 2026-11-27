"use client";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { PLAN_PRICES, formatSom, type Plan } from "@/lib/data";

const ORDER: Plan[] = ["start", "standard", "premium", "driver"];

export function PricingPlans() {
  const t = useTranslations("pricing");
  const tc = useTranslations();
  const [bill, setBill] = useState<"month" | "year">("month");
  const [note, setNote] = useState(false);

  return (
    <>
      <div className="sec-head">
        <div><h1 style={{ fontSize: "clamp(22px,3vw,34px)" }}>{t("title")}</h1><p>{t("lead")}</p></div>
        <div className="tabs" role="group">
          <button className={bill === "month" ? "on" : undefined} onClick={() => setBill("month")}>{t("monthly")}</button>
          <button className={bill === "year" ? "on" : undefined} onClick={() => setBill("year")}>{t("yearly")}</button>
        </div>
      </div>
      <div className="plans">
        {ORDER.map((p) => {
          const price = PLAN_PRICES[p][bill];
          const save = PLAN_PRICES[p].month * 12 - PLAN_PRICES[p].year;
          const hl = p === "premium";
          return (
            <div key={p} className={`plan${hl ? " hl" : ""}`} data-tag={t("popular")}>
              <div><h3>{t(`plans.${p}.name`)}</h3><p className="who">{t(`plans.${p}.who`)}</p></div>
              <div className="amt">
                {price ? `${formatSom(price)} ${tc("som")}` : t("free")} {price ? <small>{bill === "year" ? t("perYear") : t("perMonth")}</small> : null}
              </div>
              <div className="save">{bill === "year" && save > 0 ? t("save", { sum: formatSom(save) }) : ""}</div>
              <ul>
                {(t.raw(`plans.${p}.f`) as string[]).map((f) => <li key={f}>{f}</li>)}
                {(t.raw(`plans.${p}.no`) as string[]).map((f) => <li key={f} className="no">{f}</li>)}
              </ul>
              <button className={`btn${hl ? "" : " ghost"}`} onClick={() => setNote(true)}>{t("choose")}</button>
            </div>
          );
        })}
      </div>
      {note && <p className="note" role="status" style={{ marginTop: 16 }}>{t("next")}</p>}
    </>
  );
}
