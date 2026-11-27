/**
 * Listings stored in Supabase (owner edits, plans, new listings added in the dashboard).
 *
 * Read at build time (and on the rare runtime render) with the publishable key: RLS returns
 * published listings only. If Supabase is unreachable the site falls back to the migrated JSON,
 * so a build never fails because of the database.
 */
import { SUPABASE_KEY, SUPABASE_URL } from "./supabase-config";

export interface DbListing {
  slug: string;
  kind: "stay" | "driver";
  name: string;
  status: string;
  plan: "start" | "standard" | "premium" | "driver";
  plan_until: string | null;
  whatsapp: string | null;
  telegram: string | null;
  phone: string | null;
  data: { description?: string; priceFrom?: number; village?: string; type?: string };
  legacy_id: number | null;
  created_at: string;
}

/** The agency number: shown instead of the host's own contacts on the free Start plan. */
export const AGENCY_WHATSAPP = "+996505581681";

const FIELDS = "slug,kind,name,status,plan,plan_until,whatsapp,telegram,phone,data,legacy_id,created_at";

const STAMP = Date.now().toString(36);
let cache: Promise<Map<string, DbListing>> | null = null;

export function getDbListings(): Promise<Map<string, DbListing>> {
  cache ??= (async () => {
    try {
      // The stamp makes every build read fresh data: Next.js (and the Cloudflare build cache) would
      // otherwise replay the response saved by a previous build. Pages stay static.
      const res = await fetch(`${SUPABASE_URL}/rest/v1/listings?select=${FIELDS}&status=eq.published&limit=5000`, {
        cache: "force-cache",
        headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}`, "x-build": STAMP },
        signal: AbortSignal.timeout(8000),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const rows = (await res.json()) as DbListing[];
      return new Map(rows.map((r) => [r.slug, r]));
    } catch (e) {
      console.warn("[listings] Supabase unavailable, using migrated content only:", e);
      return new Map();
    }
  })();
  return cache;
}

/** Paid plans fall back to Start when their end date has passed. */
export function effectivePlan(r: Pick<DbListing, "plan" | "plan_until">): "start" | "standard" | "premium" {
  if (r.plan === "start") return "start";
  if (r.plan_until && r.plan_until < new Date().toISOString().slice(0, 10)) return "start";
  return r.plan === "premium" ? "premium" : "standard";
}

/** Contacts a tourist sees: the host's own on paid plans, the agency's on Start. */
export function visibleContacts(
  plan: "start" | "standard" | "premium",
  r: Partial<Pick<DbListing, "whatsapp" | "telegram" | "phone">>,
): { whatsapp: string; telegram?: string; phone: string; direct: boolean } {
  if (plan === "start" || !r.whatsapp) return { whatsapp: AGENCY_WHATSAPP, phone: AGENCY_WHATSAPP, direct: false };
  return { whatsapp: r.whatsapp, telegram: r.telegram || undefined, phone: r.phone || r.whatsapp, direct: true };
}

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/** Owner's plain-text description → simple HTML paragraphs. */
export const textToHtml = (t: string) =>
  t.split(/\n{2,}/).map((p) => `<p>${esc(p.trim()).replace(/\n/g, "<br>")}</p>`).join("\n");
