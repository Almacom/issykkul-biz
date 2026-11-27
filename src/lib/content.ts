/**
 * Content migrated from the old site lives as JSON in /public/content
 * (built by scripts/migrate/build_content.py). It is served as static assets,
 * so it does not count towards the worker size limit.
 *
 * - On Cloudflare: read through the ASSETS binding.
 * - During `next build` / `next dev`: read from disk.
 */
import type { Locale } from "@/i18n/routing";
import { effectivePlan, getDbListings, getDbReviews, textToHtml, visibleContacts, type DbListing, type DbReview } from "./listings";

const memo = new Map<string, Promise<unknown>>();

async function fromAssets(path: string): Promise<unknown | undefined> {
  try {
    const { getCloudflareContext } = await import("@opennextjs/cloudflare");
    const { env } = await getCloudflareContext({ async: true });
    const assets = (env as { ASSETS?: { fetch: (u: string) => Promise<Response> } }).ASSETS;
    if (!assets) return undefined;
    const res = await assets.fetch(`https://assets.local${path}`);
    if (!res.ok) return undefined;
    return await res.json();
  } catch {
    return undefined;
  }
}

async function fromDisk(path: string): Promise<unknown | undefined> {
  try {
    const fs = await import("node:fs/promises");
    const p = await import("node:path");
    const text = await fs.readFile(p.join(process.cwd(), "public", path), "utf8");
    return JSON.parse(text);
  } catch {
    return undefined;
  }
}

export function readContent<T>(path: string): Promise<T | null> {
  if (!memo.has(path)) {
    memo.set(path, (async () => (await fromDisk(path)) ?? (await fromAssets(path)) ?? null)());
  }
  return memo.get(path) as Promise<T | null>;
}

/* ---------- types ---------- */

export type StayType = "guest" | "cottage" | "pansionat" | "minipansionat" | "hotel" | "sanatorium" | "resort" | "yurt";
export const STAY_TYPES: StayType[] = ["guest", "pansionat", "minipansionat", "hotel", "cottage", "sanatorium", "resort"];

export interface Village { slug: string; name: Record<Locale, string>; shore: "n" | "s" | "e" | "w" }

export interface StaySummary {
  slug: string;
  type: StayType;
  village: string | null;
  name: string;
  priceFrom: number | null;
  rating: number | null;
  reviewCount: number;
  plan: "start" | "standard" | "premium";
  photo: string | null;
  photoCount: number;
  /** Object id on the old site — grows with the date the listing was added. */
  oldId?: number;
  /** When the listing was added in the dashboard (listings created on the new site). */
  addedAt?: string;
}

export interface Room {
  name: string;
  description: string;
  photos: string[];
  prices: { period: string; price: number; per: string }[];
}

export interface Stay extends StaySummary {
  oldId: number;
  h1: string;
  seoTitle: string;
  seoDescription: string;
  descriptionHtml: string;
  foodHtml: string;
  priceNote: string;
  rooms: Room[];
  photos: string[];
  /** Object albums from the old site (grounds, beach, cafe…), shown before room photos. */
  albums?: { title: string; photos: string[] }[];
  cover?: string | null;
  /** Old site's additional info: distances, room stock, free and paid services. */
  info?: import("@/components/StayFeatures").StayInfo | null;
  whatsapp: string;
  telegram?: string;
  phone?: string;
  /** false on the Start plan: the agency's contacts are shown instead of the host's. */
  directContacts?: boolean;
}

export interface Review {
  id: number; author: string; from: string; rating: number; date: string; title: string; text: string; with: string;
}

export interface ArticleSummary {
  path: string; section: string; h1: string; seoTitle: string; seoDescription: string; village: string | null;
  /** Card data for section pages. */
  photo?: string | null; excerpt?: string;
}
export interface Article extends ArticleSummary {
  html: string;
  relatedStays: string[];
  faq?: { q: string; a: string }[];
  albums?: { title: string; photos: string[] }[];
}

/* ---------- accessors ---------- */

export const getVillages = async () => (await readContent<Village[]>("/content/villages.json")) ?? [];
/* Migrated JSON + Supabase: owner edits and plans override the JSON; listings added on the new site are appended. */

/** Adds reviews approved on the new site to the migrated count and average rating. */
function withNewReviews<T extends StaySummary>(s: T, revs: DbReview[] | undefined): T {
  if (!revs?.length) return s;
  const oldSum = (s.rating ?? 0) * (s.reviewCount ?? 0);
  const count = (s.reviewCount ?? 0) + revs.length;
  return { ...s, reviewCount: count, rating: Math.round(((oldSum + revs.reduce((n, r) => n + r.rating, 0)) / count) * 100) / 100 };
}

function applyDb<T extends StaySummary>(s: T, r: DbListing | undefined): T {
  if (!r) return s;
  return {
    ...s,
    name: r.name || s.name,
    plan: effectivePlan(r),
    priceFrom: r.data?.priceFrom ?? s.priceFrom,
  };
}

function summaryFromDb(r: DbListing): StaySummary {
  return {
    slug: r.slug,
    type: ((r.data?.type as StayType) ?? "guest"),
    village: r.data?.village ?? null,
    name: r.name,
    priceFrom: r.data?.priceFrom ?? null,
    rating: null,
    reviewCount: 0,
    plan: effectivePlan(r),
    photo: null,
    photoCount: 0,
    addedAt: r.created_at,
  };
}

export const getStayIndex = async (): Promise<StaySummary[]> => {
  const [base, db, revs] = await Promise.all([readContent<StaySummary[]>("/content/stays/index.json"), getDbListings(), getDbReviews()]);
  const list = (base ?? []).map((s) => applyDb(s, db.get(s.slug)));
  const known = new Set(list.map((s) => s.slug));
  for (const r of db.values()) if (r.kind === "stay" && !known.has(r.slug)) list.push(summaryFromDb(r));
  return list.map((s) => withNewReviews(s, revs.get(s.slug)));
};

export const getStayBySlug = async (slug: string): Promise<Stay | null> => {
  const [base, db] = await Promise.all([readContent<Stay>(`/content/stays/${slug}.json`), getDbListings()]);
  const r = db.get(slug);
  if (!base && !(r && r.kind === "stay")) return null;
  const stay: Stay = base
    ? applyDb(base, r)
    : {
        ...summaryFromDb(r!),
        oldId: 0,
        h1: r!.name,
        seoTitle: `${r!.name} — Иссык-Куль`,
        seoDescription: (r!.data?.description ?? "").slice(0, 160),
        descriptionHtml: "",
        foodHtml: "",
        priceNote: "",
        rooms: [],
        photos: [],
        whatsapp: "",
      };
  if (r?.data?.description) stay.descriptionHtml = textToHtml(r.data.description);
  if (r?.data?.free || r?.data?.paid) {
    stay.info = {
      ...(stay.info ?? {}),
      ...(r.data.free ? { free: r.data.free } : {}),
      ...(r.data.paid ? { paid: r.data.paid.map((p) => ({ name: p.name, price: p.price, text: "" })) } : {}),
    };
  }
  const c = visibleContacts(stay.plan, r ?? { whatsapp: base?.whatsapp });
  const revs = (await getDbReviews()).get(slug);
  return { ...withNewReviews(stay, revs), whatsapp: c.whatsapp, telegram: c.telegram, phone: c.phone, directContacts: c.direct };
};
export const getReviews = async (slug: string): Promise<Review[]> => {
  const [old, db] = await Promise.all([readContent<Review[]>(`/content/reviews/${slug}.json`), getDbReviews()]);
  const fresh: Review[] = (db.get(slug) ?? []).map((r) => ({
    id: 1_000_000_000 + r.id, author: r.author, from: r.from_place ?? "", rating: r.rating, date: r.created_at.slice(0, 10),
    title: r.title ?? "", text: r.text, with: r.traveled_with ?? "",
  }));
  return [...fresh, ...(old ?? [])];
};
export const getArticleIndex = async () => (await readContent<ArticleSummary[]>("/content/articles/index.json")) ?? [];
export const getArticle = (path: string) =>
  readContent<Article>(`/content/articles/${path.replace(/^\//, "").replace(/\//g, "__")}.json`);

const planRank = { premium: 2, standard: 1, start: 0 } as const;
export const byPromotion = (a: StaySummary, b: StaySummary) =>
  planRank[b.plan] - planRank[a.plan] || (b.reviewCount ?? 0) - (a.reviewCount ?? 0) || (b.rating ?? 0) - (a.rating ?? 0);

/** Photos are served from Cloudflare R2 (bucket issykkul-photos) via img.issykkul.biz. */
export const IMAGE_BASE = process.env.NEXT_PUBLIC_IMAGE_BASE ?? "https://img.issykkul.biz";
export const img = (p: string | null | undefined) => (p ? (p.startsWith("http") ? p : IMAGE_BASE + p) : null);

/** Rewrites image paths inside migrated HTML to the current image host. */
export const withImageBase = (html: string) => html.replace(/src="\/portals\//gi, `src="${IMAGE_BASE}/portals/`);

export function villageName(villages: Village[], slug: string | null, locale: Locale): string {
  const v = villages.find((x) => x.slug === slug);
  return v ? v.name[locale] : locale === "en" ? "Issyk-Kul" : locale === "ky" ? "Ысык-Көл" : "Иссык-Куль";
}
