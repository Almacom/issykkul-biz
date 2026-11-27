"use client";
import { useCallback, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { supabase, type Claim, type Listing, type ListingPlan, type ListingStatus } from "@/lib/supabase";
import { PLAN_PRICES, formatSom } from "@/lib/data";
import { useAccount } from "./useAccount";
import { ListingEditor } from "./ListingEditor";

type Tab = "claims" | "pending" | "all";

export function Admin() {
  const t = useTranslations("account");
  const { session, profile, loading } = useAccount();
  const [tab, setTab] = useState<Tab>("claims");
  const [claims, setClaims] = useState<Claim[]>([]);
  const [pending, setPending] = useState<Listing[]>([]);

  const load = useCallback(async () => {
    const sb = supabase();
    const [{ data: cs }, { data: ps }] = await Promise.all([
      sb.from("claims").select("*, listings(name, slug), profiles(email, full_name, phone)").eq("status", "pending").order("created_at"),
      sb.from("listings").select("*").eq("status", "pending").order("created_at"),
    ]);
    setClaims((cs as Claim[]) ?? []);
    setPending((ps as Listing[]) ?? []);
  }, []);

  useEffect(() => { if (profile?.role === "admin") load(); }, [profile, load]);

  if (loading) return <p className="muted">…</p>;
  if (!session || profile?.role !== "admin") return (
    <div className="acc-box">
      <h1>{t("admin")}</h1>
      <p className="muted">{t("adminOnly")}</p>
      <Link className="btn" href={session ? "/cabinet" : "/login"}>{session ? t("cabinet") : t("loginTitle")}</Link>
    </div>
  );

  async function decideClaim(c: Claim, approve: boolean) {
    const sb = supabase();
    const { error } = approve
      ? await sb.rpc("approve_claim", { claim_id: c.id })
      : await sb.from("claims").update({ status: "rejected" }).eq("id", c.id);
    if (error) alert(error.message); else load();
  }

  async function setStatus(l: Listing, status: ListingStatus) {
    const { error } = await supabase().from("listings").update({ status }).eq("id", l.id);
    if (error) alert(error.message); else load();
  }

  return (
    <div className="acc">
      <div className="acc-head">
        <div><h1>{t("admin")}</h1><p className="muted">{session.user.email}</p></div>
        <div className="acc-actions"><Link className="btn sm ghost" href="/cabinet">{t("cabinet")}</Link></div>
      </div>
      <div className="acc-tabs">
        <button className={tab === "claims" ? "on" : ""} onClick={() => setTab("claims")}>{t("tabClaims")} ({claims.length})</button>
        <button className={tab === "pending" ? "on" : ""} onClick={() => setTab("pending")}>{t("tabPending")} ({pending.length})</button>
        <button className={tab === "all" ? "on" : ""} onClick={() => setTab("all")}>{t("tabAll")}</button>
      </div>

      {tab === "claims" && (
        <section className="acc-sec">
          {claims.length === 0 && <p className="muted">{t("empty")}</p>}
          {claims.map((c) => (
            <div key={c.id} className="acc-card">
              <h3><Link href={`/stays/${c.listings?.slug}`} target="_blank">{c.listings?.name}</Link></h3>
              <p>{c.profiles?.email} {c.profiles?.full_name ? `· ${c.profiles.full_name}` : ""} {c.profiles?.phone ? `· ${c.profiles.phone}` : ""}</p>
              {c.message && <p className="acc-quote">{c.message}</p>}
              <p className="muted small">{new Date(c.created_at).toLocaleString("ru-RU")}</p>
              <div className="acc-actions">
                <button className="btn sm" onClick={() => decideClaim(c, true)}>{t("approve")}</button>
                <button className="btn sm ghost" onClick={() => decideClaim(c, false)}>{t("reject")}</button>
              </div>
            </div>
          ))}
        </section>
      )}

      {tab === "pending" && (
        <section className="acc-sec">
          {pending.length === 0 && <p className="muted">{t("empty")}</p>}
          {pending.map((l) => (
            <div key={l.id} className="acc-card">
              <h3>{l.name} <span className="muted small">({l.kind === "stay" ? t("kindStay") : t("kindDriver")})</span></h3>
              <p className="muted">{[l.data?.village, l.whatsapp, l.phone].filter(Boolean).join(" · ")}</p>
              {l.data?.description && <p className="acc-quote">{l.data.description}</p>}
              <div className="acc-actions">
                <button className="btn sm" onClick={() => setStatus(l, "published")}>{t("publish")}</button>
                <button className="btn sm ghost" onClick={() => setStatus(l, "hidden")}>{t("hide")}</button>
              </div>
            </div>
          ))}
        </section>
      )}

      {tab === "all" && <AllListings uid={session.user.id} />}
    </div>
  );
}

function AllListings({ uid }: { uid: string }) {
  const t = useTranslations("account");
  const tp = useTranslations("pricing.plans");
  const [q, setQ] = useState("");
  const [rows, setRows] = useState<Listing[]>([]);
  const [open, setOpen] = useState<{ id: number; mode: "edit" | "plan" } | null>(null);

  const search = useCallback(async (term: string) => {
    let req = supabase().from("listings").select("*").order("name").limit(50);
    const s = term.trim().replace(/[%,()]/g, " ");
    if (s) req = req.ilike("name", `%${s}%`);
    const { data } = await req;
    setRows((data as Listing[]) ?? []);
  }, []);

  useEffect(() => { search(""); }, [search]);
  const replace = (l: Listing) => setRows((xs) => xs.map((x) => (x.id === l.id ? l : x)));

  return (
    <section className="acc-sec">
      <form className="acc-inline" onSubmit={(e) => { e.preventDefault(); search(q); }}>
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t("claimSearch")} />
        <button className="btn sm">{t("find")}</button>
      </form>
      {rows.map((l) => (
        <div key={l.id} className="acc-card">
          <div className="acc-card-head">
            <div>
              <h3>{l.name}</h3>
              <p className="muted small">
                <span className={`tag st-${l.status}`}>{t(`status.${l.status}`)}</span>{" "}
                {tp(`${l.plan}.name`)}{l.plan_until ? ` · ${t("until", { date: new Date(l.plan_until).toLocaleDateString("ru-RU") })}` : ""}
                {" · "}{l.owner_id ? t("hasOwner") : t("noOwner")}
              </p>
            </div>
            <div className="acc-actions">
              <button className="btn sm ghost" onClick={() => setOpen(open?.id === l.id && open.mode === "plan" ? null : { id: l.id, mode: "plan" })}>{t("addPlan")}</button>
              <button className="btn sm" onClick={() => setOpen(open?.id === l.id && open.mode === "edit" ? null : { id: l.id, mode: "edit" })}>{t("edit")}</button>
            </div>
          </div>
          {open?.id === l.id && open.mode === "edit" && <ListingEditor listing={l} onSaved={replace} />}
          {open?.id === l.id && open.mode === "plan" && (
            <PlanForm listing={l} uid={uid} onDone={async () => {
              const { data } = await supabase().from("listings").select("*").eq("id", l.id).single();
              if (data) replace(data as Listing);
              setOpen(null);
            }} />
          )}
        </div>
      ))}
    </section>
  );
}

function addMonths(d: Date, n: number) {
  const r = new Date(d);
  r.setMonth(r.getMonth() + n);
  return r.toISOString().slice(0, 10);
}

/** Records a manual payment; the database trigger then sets the listing's plan and end date. */
function PlanForm({ listing, uid, onDone }: { listing: Listing; uid: string; onDone: () => void }) {
  const t = useTranslations("account");
  const tp = useTranslations("pricing.plans");
  const [plan, setPlan] = useState<Exclude<ListingPlan, "start">>(listing.kind === "driver" ? "driver" : "standard");
  const [period, setPeriod] = useState<"month" | "year">("year");
  const [amount, setAmount] = useState(String(PLAN_PRICES[plan].year));
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);

  const from = listing.plan_until && new Date(listing.plan_until) > new Date() && listing.plan === plan ? new Date(listing.plan_until) : new Date();
  const ends = addMonths(from, period === "year" ? 12 : 1);

  function choose(p: typeof plan, per: typeof period) {
    setPlan(p); setPeriod(per); setAmount(String(PLAN_PRICES[p][per]));
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const { error } = await supabase().from("subscriptions").insert({
      listing_id: listing.id, plan, starts_at: from.toISOString().slice(0, 10), ends_at: ends,
      amount: parseInt(amount.replace(/\D/g, ""), 10) || 0, note: note.trim() || null, created_by: uid,
    });
    setBusy(false);
    if (error) alert(error.message); else onDone();
  }

  return (
    <form onSubmit={save} className="acc-form">
      <div className="acc-row">
        <label>{t("fPlan")}
          <select value={plan} onChange={(e) => choose(e.target.value as typeof plan, period)}>
            {(["standard", "premium", "driver"] as const).map((p) => <option key={p} value={p}>{tp(`${p}.name`)}</option>)}
          </select>
        </label>
        <label>{t("fPeriod")}
          <select value={period} onChange={(e) => choose(plan, e.target.value as typeof period)}>
            <option value="month">{t("month")}</option>
            <option value="year">{t("year")}</option>
          </select>
        </label>
        <label>{t("fAmount")}<input inputMode="numeric" value={amount} onChange={(e) => setAmount(e.target.value)} /></label>
      </div>
      <label>{t("fNote")}<input value={note} onChange={(e) => setNote(e.target.value)} placeholder="MBank, 27.11" /></label>
      <p className="muted small">{t("planSummary", { plan: tp(`${plan}.name`), until: new Date(ends).toLocaleDateString("ru-RU"), sum: formatSom(parseInt(amount, 10) || 0) })}</p>
      <div className="acc-actions"><button className="btn sm" disabled={busy}>{t("activate")}</button></div>
    </form>
  );
}
