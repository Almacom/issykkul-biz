"use client";
import { useEffect, useState } from "react";
import { AMENITY_OPTIONS } from "@/lib/amenities";
import { useTranslations } from "next-intl";
import { supabase, type Listing } from "@/lib/supabase";

/** Edit form for a listing's contacts and short texts (used by owners and by the admin). */
export function ListingEditor({ listing, onSaved }: { listing: Listing; onSaved: (l: Listing) => void }) {
  const t = useTranslations("account");
  const [f, setF] = useState({
    name: listing.name,
    whatsapp: listing.whatsapp ?? "",
    telegram: listing.telegram ?? "",
    phone: listing.phone ?? "",
    description: listing.data?.description ?? "",
    priceFrom: listing.data?.priceFrom ? String(listing.data.priceFrom) : "",
  });
  const [free, setFree] = useState<string[]>(listing.data?.free ?? []);
  const [paid, setPaid] = useState<{ name: string; price: string }[]>(
    (listing.data?.paid ?? []).map((p) => ({ name: p.name, price: p.price ? String(p.price) : "" })),
  );
  const [custom, setCustom] = useState("");
  // Migrated listings: start from what the old site had, until the owner saves their own list.
  useEffect(() => {
    if (listing.data?.free || listing.data?.paid || listing.legacy_id == null) return;
    fetch(`/content/stays/${listing.slug}.json`)
      .then((r) => (r.ok ? r.json() : null))
      .then((st: { info?: { free?: string[]; paid?: { name: string; price: number | null }[] } } | null) => {
        if (st?.info?.free) setFree(st.info.free);
        if (st?.info?.paid) setPaid(st.info.paid.map((p) => ({ name: p.name, price: p.price ? String(p.price) : "" })));
      })
      .catch(() => {});
  }, [listing]);
  const toggle = (a: string) => setFree((xs) => (xs.includes(a) ? xs.filter((x) => x !== a) : [...xs, a]));
  const options = [...AMENITY_OPTIONS, ...free.filter((x) => !AMENITY_OPTIONS.includes(x))];
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setF({ ...f, [k]: e.target.value });

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setMsg("");
    const price = parseInt(f.priceFrom.replace(/\D/g, ""), 10);
    const { data, error } = await supabase().from("listings").update({
      name: f.name.trim(),
      whatsapp: f.whatsapp.trim() || null,
      telegram: f.telegram.trim().replace(/^@/, "") || null,
      phone: f.phone.trim() || null,
      data: {
        ...listing.data,
        description: f.description.trim() || undefined,
        priceFrom: Number.isFinite(price) ? price : undefined,
        free,
        paid: paid.filter((p) => p.name.trim()).map((p) => ({ name: p.name.trim(), price: parseInt(p.price.replace(/\D/g, ""), 10) || null })),
      },
    }).eq("id", listing.id).select().single();
    setBusy(false);
    if (error) setMsg(error.message);
    else { setMsg(t("saved")); onSaved(data as Listing); }
  }

  return (
    <form onSubmit={save} className="acc-form">
      <label>{t("fName")}<input required value={f.name} onChange={set("name")} /></label>
      <div className="acc-row">
        <label>WhatsApp<input value={f.whatsapp} onChange={set("whatsapp")} placeholder="+996 555 123 456" /></label>
        <label>Telegram<input value={f.telegram} onChange={set("telegram")} placeholder="username" /></label>
        <label>{t("fPhone")}<input value={f.phone} onChange={set("phone")} placeholder="+996 555 123 456" /></label>
      </div>
      <label>{t("fPrice")}<input inputMode="numeric" value={f.priceFrom} onChange={set("priceFrom")} placeholder="2000" /></label>
      <label>{t("fDescription")}<textarea rows={5} value={f.description} onChange={set("description")} /></label>
      <fieldset className="acc-fs">
        <legend>{t("fFree")}</legend>
        <div className="acc-checks">
          {options.map((a) => (
            <label key={a} className="acc-check"><input type="checkbox" checked={free.includes(a)} onChange={() => toggle(a)} />{a}</label>
          ))}
        </div>
        <div className="acc-inline">
          <input value={custom} onChange={(e) => setCustom(e.target.value)} placeholder={t("fFreeOther")} />
          <button type="button" className="btn sm ghost" onClick={() => { const v = custom.trim(); if (v && !free.includes(v)) setFree([...free, v]); setCustom(""); }}>+</button>
        </div>
      </fieldset>
      <fieldset className="acc-fs">
        <legend>{t("fPaid")}</legend>
        {paid.map((p, i) => (
          <div key={i} className="acc-paid">
            <input value={p.name} onChange={(e) => setPaid(paid.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)))} placeholder={t("fPaidName")} />
            <input inputMode="numeric" value={p.price} onChange={(e) => setPaid(paid.map((x, j) => (j === i ? { ...x, price: e.target.value } : x)))} placeholder={t("fPaidPrice")} />
            <button type="button" className="btn sm ghost" onClick={() => setPaid(paid.filter((_, j) => j !== i))} aria-label={t("remove")}>✕</button>
          </div>
        ))}
        <button type="button" className="btn sm ghost" onClick={() => setPaid([...paid, { name: "", price: "" }])}>{t("fPaidAdd")}</button>
      </fieldset>
      <div className="acc-actions">
        <button className="btn sm" disabled={busy}>{busy ? "…" : t("save")}</button>
        {msg && <span className="muted">{msg}</span>}
      </div>
    </form>
  );
}
