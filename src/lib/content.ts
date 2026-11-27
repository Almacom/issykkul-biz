/**
 * Content migrated from the old site lives as JSON in /public/content
 * (built by scripts/migrate/build_content.py). It is served as static assets,
 * so it does not count towards the worker size limit.
 *
 * - On Cloudflare: read through the ASSETS binding.
 * - During `next build` / `next dev`: read from disk.
 */
import type { Locale } from "@/i18n/routing";

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
  whatsapp: string;
}

export interface Review {
  id: number; author: string; from: string; rating: number; date: string; title: string; text: string; with: string;
}

export interface ArticleSummary {
  path: string; section: string; h1: string; seoTitle: string; seoDescription: string; village: string | null;
}
export interface Article extends ArticleSummary { html: string; relatedStays: string[]; faq?: { q: string; a: string }[] }

/* ---------- accessors ---------- */

export const getVillages = async () => (await readContent<Village[]>("/content/villages.json")) ?? [];
export const getStayIndex = async () => (await readContent<StaySummary[]>("/content/stays/index.json")) ?? [];
export const getStayBySlug = (slug: string) => readContent<Stay>(`/content/stays/${slug}.json`);
export const getReviews = async (slug: string) => (await readContent<Review[]>(`/content/reviews/${slug}.json`)) ?? [];
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
