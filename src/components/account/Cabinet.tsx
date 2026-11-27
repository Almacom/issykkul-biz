"use client";
import { useCallback, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { supabase, makeSlug, type Claim, type Listing } from "@/lib/supabase";
import { useAccount } from "./useAccount";
import { ListingEditor } from "./ListingEditor";

const AGENCY_WA = "996505581681";

export function Cabinet() {
  const t = useTranslations("account");
  const tp = useTranslations("pricing.plans");
  const { session, profile, loading } = useAccount();
  const [listings, setListings] = useState<Listing[]>([]);
  const [claims, setClaims] = useState<Claim[]>([]);
  const [clicks, setClicks] = useState<Record<string, number>>({});
  const [open, setOpen] = useState<number | null>(null);

  const load = useCallback(async (uid: string) => {
    const sb = supabase();
    const [{ data: ls }, { data: cs }] = await Promise.all([
      sb.from("listings").select("*").eq("owner_id", uid).order("name"),
      sb.from("claims").select("*, listings(name, slug)").eq("user_id", uid).order("created_at", { ascending: false }),
    ]);
    const mine = (ls as Listing[]) ?? [];
    setListings(mine);
    setClaims((cs as Claim[]) ?? []);
    if (mine.length) {
      const since = new Date(Date.now() - 30 * 864e5).toISOString();
      const { data: cl } = await sb.from("contact_clicks").select("listing_slug").in("listing_slug", mine.map((l) => l.slug)).gte("created_at", since);
      const n: Record<string, number> = {};
      for (const c of (cl ?? []) as { listing_slug: string }[]) n[c.listing_slug] = (n[c.listing_slug] ?? 0) + 1;
      setClicks(n);
    }
  }, []);

  useEffect(() => { if (session) load(session.user.id); }, [session, load]);

  if (loading) return <p className="muted">…</p>;
  if (!session) return (
    <div className="acc-box">
      <h1>{t("cabinet")}</h1>
      <p className="muted">{t("needLogin")}</p>
      <Link className="btn" href="/login">{t("loginTitle")}</Link>
    </div>
  );

  const replace = (l: Listing) => setListings((xs) => xs.map((x) => (x.id === l.id ? l : x)));

  return (
    <div className="acc">
      <div className="acc-head">
        <div>
          <h1>{t("cabinet")}</h1>
          <p className="muted">{session.user.email}</p>
        </div>
        <div className="acc-actions">
          {profile?.role === "admin" && <Link className="btn sm sand" href="/admin">{t("admin")}</Link>}
          <button className="btn sm ghost" onClick={() => supabase().auth.signOut()}>{t("signOut")}</button>
        </div>
      </div>

      <section className="acc-sec">
        <h2>{t("myListings")}</h2>
        {listings.length === 0 && <p className="muted">{t("noListings")}</p>}
        {listings.map((l) => (
          <div key={l.id} className="acc-card">
            <div className="acc-card-head">
              <div>
                <h3>{l.name}</h3>
                <p className="muted">
                  <span className={`tag st-${l.status}`}>{t(`status.${l.status}`)}</span>{" "}
                  {tp(`${l.plan}.name`)}{l.plan_until ? ` · ${t("until", { date: new Date(l.plan_until).toLocaleDateString("ru-RU") })}` : ""}
                  {" · "}{t("clicks30", { n: clicks[l.slug] ?? 0 })}
                </p>
              </div>
              <div className="acc-actions">
                {l.status === "published" && l.kind === "stay" && l.legacy_id != null && <Link className="btn sm ghost" href={`/stays/${l.slug}`}>{t("view")}</Link>}
                <button className="btn sm" onClick={() => setOpen(open === l.id ? null : l.id)}>{open === l.id ? t("close") : t("edit")}</button>
              </div>
            </div>
            {open === l.id && <ListingEditor listing={l} onSaved={replace} />}
          </div>
        ))}
        <p className="muted small">
          {t("payHint")}{" "}
          <a href={`https://wa.me/${AGENCY_WA}?text=${encodeURIComponent(t("payText"))}`} target="_blank" rel="noopener">WhatsApp</a>
          {" · "}<Link href="/pricing">{t("plansLink")}</Link>
        </p>
      </section>

      {claims.length > 0 && (
        <section className="acc-sec">
          <h2>{t("myClaims")}</h2>
          <ul className="acc-list">
            {claims.map((c) => (
              <li key={c.id}>{c.listings?.name} — <span className={`tag cl-${c.status}`}>{t(`claim.${c.status}`)}</span></li>
            ))}
          </ul>
        </section>
      )}

      <ClaimSearch uid={session.user.id} claimed={claims.map((c) => c.listing_id)} onDone={() => load(session.user.id)} />
      <NewListing uid={session.user.id} onDone={() => load(session.user.id)} />
    </div>
  );
}

function ClaimSearch({ uid, claimed, onDone }: { uid: string; claimed: number[]; onDone: () => void }) {
  const t = useTranslations("account");
  const [q, setQ] = useState("");
  const [found, setFound] = useState<Pick<Listing, "id" | "name" | "slug">[] | null>(null);
  const [pick, setPick] = useState<number | null>(null);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  async function search(e: React.FormEvent) {
    e.preventDefault();
    const term = q.trim().replace(/[%,()]/g, " ");
    if (term.length < 2) return;
    const { data } = await supabase().from("listings").select("id, name, slug").is("owner_id", null).eq("kind", "stay").ilike("name", `%${term}%`).order("name").limit(15);
    setFound((data as Pick<Listing, "id" | "name" | "slug">[]) ?? []);
  }

  async function claim(e: React.FormEvent) {
    e.preventDefault();
    if (pick == null) return;
    setBusy(true);
    const { error } = await supabase().from("claims").insert({ listing_id: pick, user_id: uid, message: message.trim() || null });
    setBusy(false);
    if (error) setMsg(error.code === "23505" ? t("claimDup") : error.message);
    else { setMsg(t("claimSent")); setPick(null); setMessage(""); onDone(); }
  }

  return (
    <section className="acc-sec">
      <h2>{t("claimTitle")}</h2>
      <p className="muted">{t("claimLead")}</p>
      <form onSubmit={search} className="acc-inline">
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t("claimSearch")} />
        <button className="btn sm">{t("find")}</button>
      </form>
      {found && found.length === 0 && <p className="muted">{t("nothingFound")}</p>}
      {found && found.length > 0 && (
        <ul className="acc-list">
          {found.map((l) => (
            <li key={l.id}>
              <Link href={`/stays/${l.slug}`} target="_blank">{l.name}</Link>{" "}
              {claimed.includes(l.id)
                ? <span className="muted">— {t("claim.pending")}</span>
                : <button className="linkbtn" onClick={() => { setPick(l.id); setMsg(""); }}>{t("thisIsMine")}</button>}
              {pick === l.id && (
                <form onSubmit={claim} className="acc-form">
                  <label>{t("claimMessage")}<textarea rows={3} required value={message} onChange={(e) => setMessage(e.target.value)} placeholder={t("claimPlaceholder")} /></label>
                  <div className="acc-actions"><button className="btn sm" disabled={busy}>{t("sendClaim")}</button></div>
                </form>
              )}
            </li>
          ))}
        </ul>
      )}
      {msg && <p className="muted">{msg}</p>}
    </section>
  );
}

function NewListing({ uid, onDone }: { uid: string; onDone: () => void }) {
  const t = useTranslations("account");
  const [show, setShow] = useState(false);
  const [f, setF] = useState({ name: "", kind: "stay", village: "", whatsapp: "", phone: "", description: "" });
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => setF({ ...f, [k]: e.target.value });

  async function create(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setMsg("");
    const { error } = await supabase().from("listings").insert({
      slug: makeSlug(f.name), kind: f.kind, owner_id: uid, name: f.name.trim(), status: "pending", plan: "start",
      whatsapp: f.whatsapp.trim() || null, phone: f.phone.trim() || null,
      data: { village: f.village.trim() || undefined, description: f.description.trim() || undefined },
    });
    setBusy(false);
    if (error) setMsg(error.message);
    else { setMsg(t("createdPending")); setShow(false); setF({ name: "", kind: "stay", village: "", whatsapp: "", phone: "", description: "" }); onDone(); }
  }

  return (
    <section className="acc-sec">
      <h2>{t("newTitle")}</h2>
      {!show ? (
        <button className="btn sm ghost" onClick={() => setShow(true)}>{t("newButton")}</button>
      ) : (
        <form onSubmit={create} className="acc-form">
          <div className="acc-row">
            <label>{t("fName")}<input required value={f.name} onChange={set("name")} /></label>
            <label>{t("fKind")}
              <select value={f.kind} onChange={set("kind")}>
                <option value="stay">{t("kindStay")}</option>
                <option value="driver">{t("kindDriver")}</option>
              </select>
            </label>
            <label>{t("fVillage")}<input value={f.village} onChange={set("village")} placeholder="Чолпон-Ата" /></label>
          </div>
          <div className="acc-row">
            <label>WhatsApp<input required value={f.whatsapp} onChange={set("whatsapp")} placeholder="+996 555 123 456" /></label>
            <label>{t("fPhone")}<input value={f.phone} onChange={set("phone")} /></label>
          </div>
          <label>{t("fDescription")}<textarea rows={4} value={f.description} onChange={set("description")} /></label>
          <div className="acc-actions">
            <button className="btn sm" disabled={busy}>{t("create")}</button>
            <button type="button" className="btn sm ghost" onClick={() => setShow(false)}>{t("cancel")}</button>
          </div>
        </form>
      )}
      {msg && <p className="muted">{msg}</p>}
    </section>
  );
}
