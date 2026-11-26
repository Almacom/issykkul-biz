import type { MetadataRoute } from "next";
import { getArticleIndex, getStayIndex } from "@/lib/content";
import { SITE_URL } from "@/lib/site";

/** Russian pages only: EN/KY versions of migrated content are not translated yet (noindex). */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [stays, articles] = await Promise.all([getStayIndex(), getArticleIndex()]);
  const paths = ["/", "/stays", "/guide", "/transfers", "/pricing", ...stays.map((s) => `/stays/${s.slug}`), ...articles.map((a) => a.path)];
  return [...new Set(paths)].map((p) => ({
    url: `${SITE_URL}${p === "/" ? "" : p}`,
    priority: p === "/" ? 1 : p.startsWith("/stays/") ? 0.8 : 0.6,
  }));
}
