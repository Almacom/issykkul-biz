"use client";
import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { SUPABASE_KEY, SUPABASE_URL } from "@/lib/supabase-config";

/** Tourist review form on the stay page. Reviews are stored as "pending" and appear after the admin approves them. */
export function ReviewForm({ slug }: { slug: string }) {
  const t = useTranslations("reviewForm");
  const [open, setOpen] = useState(false);
  const [f, setF] = useState({ author: "", from: "", with: "", month: "", title: "", text: "", website: "" });
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [state, setState] = useState<"idle" | "busy" | "done" | "error">("idle");
  const [err, setErr] = useState("");
  // the "Have you stayed here?" link at the top points to #write-review: open the form
  useEffect(() => {
    const check = () => { if (location.hash === "#write-review") setOpen(true); };
    check();
    window.addEventListener("hashchange", check);
    return () => window.removeEventListener("hashchange", check);
  }, []);
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => setF({ ...f, [k]: e.target.value });

  async function send(e: React.FormEvent) {
    e.preventDefault();
    if (!rating) { setErr(t("needRating")); return; }
    if (f.text.trim().length < 20) { setErr(t("tooShort")); return; }
    setErr("");
    if (f.website) { setState("done"); return; } // honeypot: bots fill hidden fields
    setState("busy");
    const res = await fetch(`${SUPABASE_URL}/rest/v1/reviews`, {
      method: "POST",
      headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}`, "Content-Type": "application/json", Prefer: "return=minimal" },
      body: JSON.stringify({
        listing_slug: slug, author: f.author.trim(), from_place: f.from.trim() || null, traveled_with: f.with || null,
        stay_month: f.month.trim() || null, rating, title: f.title.trim() || null, text: f.text.trim(),
      }),
    }).catch(() => null);
    if (res?.ok) setState("done");
    else { setState("error"); setErr(t("failed")); }
  }

  if (state === "done") return <div className="notice rf-done">{t("thanks")}</div>;

  return (
    <div id="write-review" className="rf" style={{ scrollMarginTop: 90 }}>
      {!open ? (
        <button type="button" className="btn ghost" onClick={() => setOpen(true)}>✎ {t("open")}</button>
      ) : (
        <form onSubmit={send} className="acc-form rf-form">
          <h3 style={{ margin: 0 }}>{t("title")}</h3>
          <div>
            <span className="rf-label">{t("rating")}</span>
            <div className="rf-stars" onMouseLeave={() => setHover(0)}>
              {[1, 2, 3, 4, 5].map((n) => (
                <button type="button" key={n} className={(hover || rating) >= n ? "on" : ""} onMouseEnter={() => setHover(n)} onClick={() => setRating(n)} aria-label={`${n}/5`}>★</button>
              ))}
            </div>
          </div>
          <div className="acc-row">
            <label>{t("name")}<input required minLength={2} maxLength={60} value={f.author} onChange={set("author")} /></label>
            <label>{t("from")}<input maxLength={80} value={f.from} onChange={set("from")} placeholder={t("fromPh")} /></label>
          </div>
          <div className="acc-row">
            <label>{t("with")}
              <select value={f.with} onChange={set("with")}>
                <option value="">—</option>
                {(["family", "kids", "couple", "friends", "alone", "colleagues"] as const).map((k) => <option key={k} value={t(`withOpt.${k}`)}>{t(`withOpt.${k}`)}</option>)}
              </select>
            </label>
            <label>{t("month")}<input maxLength={20} value={f.month} onChange={set("month")} placeholder={t("monthPh")} /></label>
          </div>
          <label>{t("headline")}<input maxLength={120} value={f.title} onChange={set("title")} /></label>
          <label>{t("text")}<textarea required rows={6} maxLength={5000} value={f.text} onChange={set("text")} placeholder={t("textPh")} /></label>
          <input className="rf-hp" tabIndex={-1} autoComplete="off" value={f.website} onChange={set("website")} aria-hidden="true" />
          {err && <p className="acc-error" style={{ margin: 0 }}>{err}</p>}
          <div className="acc-actions">
            <button className="btn" disabled={state === "busy"}>{state === "busy" ? "…" : t("send")}</button>
            <span className="muted small">{t("moderation")}</span>
          </div>
        </form>
      )}
    </div>
  );
}
