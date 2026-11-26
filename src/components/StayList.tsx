import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import type { StaySummary, Village } from "@/lib/content";
import { StayCard } from "./StayCard";

export const PAGE_SIZE = 24;

/** Grid of stays with simple numbered pagination (?page=N). */
export async function StayList({ stays, villages, page, pathname, query }: {
  stays: StaySummary[]; villages: Village[]; page: number; pathname: string; query: Record<string, string | string[]>;
}) {
  const t = await getTranslations();
  const pages = Math.max(1, Math.ceil(stays.length / PAGE_SIZE));
  const cur = Math.min(Math.max(1, page), pages);
  const slice = stays.slice((cur - 1) * PAGE_SIZE, cur * PAGE_SIZE);
  if (!stays.length) return <div className="empty">{t("stays.empty")}</div>;
  return (
    <>
      <div className="grid">{slice.map((s) => <StayCard key={s.slug} stay={s} villages={villages} />)}</div>
      {pages > 1 && (
        <nav className="pager" aria-label="pagination">
          {Array.from({ length: pages }, (_, i) => i + 1).map((n) =>
            n === cur ? <span key={n} aria-current="page">{n}</span> : (
              <Link key={n} href={{ pathname, query: { ...query, page: n === 1 ? undefined : String(n) } }} aria-label={t("pager.page", { n })}>{n}</Link>
            ),
          )}
        </nav>
      )}
    </>
  );
}
