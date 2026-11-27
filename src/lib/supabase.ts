import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import { SUPABASE_KEY, SUPABASE_URL } from "./supabase-config";
export { SUPABASE_KEY, SUPABASE_URL };

let client: SupabaseClient | null = null;

/** Browser client (the cabinet and admin pages are client-rendered). */
export function supabase(): SupabaseClient {
  client ??= createClient(SUPABASE_URL, SUPABASE_KEY, {
    auth: { flowType: "implicit", persistSession: true, detectSessionInUrl: true },
  });
  return client;
}

export type ListingStatus = "draft" | "pending" | "published" | "hidden";
export type ListingPlan = "start" | "standard" | "premium" | "driver";

export interface Listing {
  id: number;
  slug: string;
  kind: "stay" | "driver";
  owner_id: string | null;
  name: string;
  status: ListingStatus;
  plan: ListingPlan;
  plan_until: string | null;
  whatsapp: string | null;
  telegram: string | null;
  phone: string | null;
  data: { description?: string; priceFrom?: number; village?: string };
  legacy_id: number | null;
  updated_at: string;
}

export interface Profile {
  id: string;
  full_name: string | null;
  phone: string | null;
  whatsapp: string | null;
  email: string | null;
  role: "owner" | "driver" | "admin";
}

export interface Claim {
  id: number;
  listing_id: number;
  user_id: string;
  message: string | null;
  status: "pending" | "approved" | "rejected";
  created_at: string;
  listings?: { name: string; slug: string } | null;
  profiles?: { email: string | null; full_name: string | null; phone: string | null } | null;
}

const TR: Record<string, string> = {
  а: "a", б: "b", в: "v", г: "g", д: "d", е: "e", ё: "e", ж: "zh", з: "z", и: "i", й: "y", к: "k", л: "l", м: "m",
  н: "n", о: "o", п: "p", р: "r", с: "s", т: "t", у: "u", ф: "f", х: "kh", ц: "ts", ч: "ch", ш: "sh", щ: "sch",
  ъ: "", ы: "y", ь: "", э: "e", ю: "yu", я: "ya", ө: "o", ү: "u", ң: "n",
};

/** URL slug for a new listing, e.g. "Гостевой дом Айгуль" → "gostevoy-dom-aygul-4f2k". */
export function makeSlug(name: string): string {
  const base = [...name.toLowerCase()].map((c) => TR[c] ?? c).join("")
    .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 50) || "object";
  return `${base}-${Math.random().toString(36).slice(2, 6)}`;
}
