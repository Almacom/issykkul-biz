import type { MetadataRoute } from "next";
import { getStays } from "@/lib/data";
import { SITE_URL } from "@/lib/site";

const prefix = { ru: "", en: "/en", ky: "/ky" } as const;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const paths = ["", "/stays", "/transfers", "/pricing", ...(await getStays()).map((s) => `/stays/${s.slug}`)];
  return paths.map((p) => ({
    url: `${SITE_URL}${p || "/"}`,
    alternates: { languages: Object.fromEntries(Object.entries(prefix).map(([l, pre]) => [l, `${SITE_URL}${pre}${p}` || SITE_URL])) },
  }));
}
