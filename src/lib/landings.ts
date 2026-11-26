import type { StaySummary, StayType } from "./content";

/** Category landing pages that replace the old catalog sections (keep their SEO text). */
export const LANDINGS: Record<string, { types?: StayType[]; village?: string; useRelated?: boolean }> = {
  "chastnyy-sektor": { types: ["guest"] },
  pansionaty: { types: ["pansionat"] },
  "mini-pansionaty": { types: ["minipansionat"] },
  oteli: { types: ["hotel"] },
  kottedzhi: { types: ["cottage"] },
  sanatorii: { types: ["sanatorium"] },
  "tsentry-otdykha": { types: ["resort"] },
  "oteli-v-bosteri": { types: ["hotel", "pansionat", "minipansionat"], village: "bosteri" },
  "oteli-v-cholpon-ate": { types: ["hotel", "pansionat", "minipansionat"], village: "cholpon-ata" },
  "gostevye-doma-v-cholpon-ate": { types: ["guest"], village: "cholpon-ata" },
  "vse-vklyucheno": { useRelated: true },
  tseny: { useRelated: true },
};

export function landingStays(slug: string, all: StaySummary[], related: string[]): StaySummary[] {
  const l = LANDINGS[slug];
  if (!l) return [];
  if (l.useRelated && related.length) {
    const bySlug = new Map(all.map((s) => [s.slug, s]));
    return related.map((r) => bySlug.get(r)).filter((s): s is StaySummary => !!s);
  }
  return all.filter((s) => (!l.types || l.types.includes(s.type)) && (!l.village || s.village === l.village));
}
