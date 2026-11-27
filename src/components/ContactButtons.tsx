"use client";
import { useEffect, useState } from "react";
import { SUPABASE_KEY, SUPABASE_URL } from "@/lib/supabase-config";
import { effectivePlan, visibleContacts, type DbListing } from "@/lib/listings";

type Props = {
  kind: "stay" | "driver";
  id: number | string;
  waText?: string;
  phone: string;
  whatsapp: string;
  telegram?: string;
  labels: { whatsapp: string; telegram: string; showPhone: string };
  small?: boolean;
  /** Listing slug: contacts are refreshed from the database, so an owner's new number shows without a rebuild. */
  live?: string;
};

/** Sends a click event so hosts can see how many contacts the site brought them. */
function track(kind: string, id: number | string, channel: string) {
  try {
    navigator.sendBeacon?.("/api/track", JSON.stringify({ kind, id, channel }));
  } catch {}
}

export function ContactButtons({ kind, id, labels, small, waText, live, ...initial }: Props) {
  const [shown, setShown] = useState(false);
  const [c, setC] = useState({ phone: initial.phone, whatsapp: initial.whatsapp, telegram: initial.telegram });
  useEffect(() => {
    if (!live) return;
    fetch(`${SUPABASE_URL}/rest/v1/listings?slug=eq.${encodeURIComponent(live)}&select=plan,plan_until,whatsapp,telegram,phone`, {
      headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` },
    })
      .then((r) => (r.ok ? r.json() : []))
      .then((rows: DbListing[]) => {
        const r = rows[0];
        if (!r) return;
        const v = visibleContacts(effectivePlan(r), r);
        setC({ phone: v.phone, whatsapp: v.whatsapp, telegram: v.telegram });
      })
      .catch(() => {});
  }, [live]);
  const { phone, whatsapp, telegram } = c;
  const cls = small ? " sm" : "";
  const wa = whatsapp.replace(/[^\d]/g, "");
  return (
    <>
      <a className={`btn wa${cls}`} href={`https://wa.me/${wa}${waText ? `?text=${encodeURIComponent(waText)}` : ""}`} target="_blank" rel="noopener" onClick={() => track(kind, id, "whatsapp")}>
        {labels.whatsapp}
      </a>
      {telegram && (
        <a className={`btn tg${cls}`} href={`https://t.me/${telegram}`} target="_blank" rel="noopener" onClick={() => track(kind, id, "telegram")}>
          {labels.telegram}
        </a>
      )}
      {shown ? (
        <a className={`btn ghost${cls}`} href={`tel:${phone}`}>{phone}</a>
      ) : (
        <button className={`btn ghost${cls}`} onClick={() => { setShown(true); track(kind, id, "phone"); }}>
          {labels.showPhone}
        </button>
      )}
    </>
  );
}
