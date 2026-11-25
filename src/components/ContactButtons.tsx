"use client";
import { useState } from "react";

type Props = {
  kind: "stay" | "driver";
  id: number;
  phone: string;
  whatsapp: string;
  telegram?: string;
  labels: { whatsapp: string; telegram: string; showPhone: string };
  small?: boolean;
};

/** Sends a click event so hosts can see how many contacts the site brought them. */
function track(kind: string, id: number, channel: string) {
  try {
    navigator.sendBeacon?.("/api/track", JSON.stringify({ kind, id, channel }));
  } catch {}
}

export function ContactButtons({ kind, id, phone, whatsapp, telegram, labels, small }: Props) {
  const [shown, setShown] = useState(false);
  const cls = small ? " sm" : "";
  const wa = whatsapp.replace(/[^\d]/g, "");
  return (
    <>
      <a className={`btn wa${cls}`} href={`https://wa.me/${wa}`} target="_blank" rel="noopener" onClick={() => track(kind, id, "whatsapp")}>
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
