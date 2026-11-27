/**
 * One route for all migrated text pages: guide articles, blog, travellers' stories,
 * category landings (/chastnyy-sektor, /oteli-v-bosteri ...), FAQ, terms, reviews.
 * Russian pages are pre-rendered; EN/KY show the Russian text with a notice and noindex.
 */
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import {
  byPromotion, getArticle, getArticleIndex, getReviews, getStayIndex, getVillages, villageName, type ArticleSummary, type Review, type StaySummary,
} from "@/lib/content";
import { LANDINGS, landingStays } from "@/lib/landings";
import { ArticleBody } from "@/components/ArticleBody";
import { ArticleAlbums } from "@/components/ArticleAlbums";
import { Photo } from "@/components/Photo";
import { Scene } from "@/components/Scene";
import { VILLAGE_XY } from "@/lib/geo";
import { StayCard } from "@/components/StayCard";
import { Reviews } from "@/components/Reviews";

type P = { params: Promise<{ locale: Locale; path: string[] }> };

const SECTIONS = ["guide/sela", "guide/ekskursii", "guide/plyazhi", "guide/kak-dobratsya", "guide/kogda-ehat", "guide/tury", "guide/detskie-lagerya", "guide", "blog", "rasskazy"];

export async function generateStaticParams() {
  const idx = await getArticleIndex();
  const paths = new Set(idx.map((a) => a.path));
  paths.add("/guide");
  return [...paths].map((p) => ({ locale: "ru", path: p.replace(/^\//, "").split("/") }));
}

export async function generateMetadata({ params }: P): Promise<Metadata> {
  const { locale, path } = await params;
  const p = "/" + path.map(decodeURIComponent).join("/");
  const t = await getTranslations({ locale, namespace: "guide" });
  const a = await getArticle(p);
  const ru = locale === "ru";
  if (!a && p === "/guide") return { title: t("title"), description: t("lead") };
  if (!a) return {};
  return {
    title: { absolute: ru ? a.seoTitle : a.h1 },
    description: a.seoDescription || undefined,
    alternates: { canonical: p },
    robots: ru ? undefined : { index: false, follow: true },
  };
}

function childrenOf(section: string, idx: ArticleSummary[], self: string) {
  return idx.filter((a) => a.path !== self && (a.section === section || (section === "guide" && a.path.split("/").length === 3 && a.path.startsWith("/guide/"))));
}

async function latestReviews(limit: number) {
  const stays = await getStayIndex();
  const withRev = stays.filter((s) => s.reviewCount > 0);
  const lists = await Promise.all(withRev.map(async (s) => (await getReviews(s.slug)).map((r) => ({ ...r, stay: s }))));
  return lists.flat().sort((a, b) => (b.date || "").localeCompare(a.date || "")).slice(0, limit);
}

export default async function TextPage({ params }: P) {
  const { locale, path } = await params;
  setRequestLocale(locale);
  const p = "/" + path.map(decodeURIComponent).join("/");
  const t = await getTranslations();
  const [article, idx, villages] = await Promise.all([getArticle(p), getArticleIndex(), getVillages()]);
  const isGuideRoot = p === "/guide";
  if (!article && !isGuideRoot) notFound();

  const landingKey = p.slice(1);
  const isLanding = !!LANDINGS[landingKey];
  const sectionKey = p.slice(1);
  const isSectionIndex = SECTIONS.includes(sectionKey);
  // Village guide pages: stays in the village first, then the article, then nearby villages.
  const villageSlug = article?.section === "guide/sela" ? article.village : null;
  const stays = (isLanding || villageSlug || article?.relatedStays.length) ? await getStayIndex() : [];
  const villageStays = villageSlug ? stays.filter((s) => s.village === villageSlug).sort(byPromotion) : [];
  const nearby = villageSlug && VILLAGE_XY[villageSlug]
    ? Object.entries(VILLAGE_XY)
        .filter(([slug]) => slug !== villageSlug)
        .map(([slug, [x, y]]) => {
          const [vx, vy] = VILLAGE_XY[villageSlug];
          const list = stays.filter((s) => s.village === slug).sort(byPromotion);
          const page = idx.find((a) => a.section === "guide/sela" && a.village === slug)?.path;
          return { slug, dist: Math.hypot(x - vx, y - vy), count: list.length, photo: list.find((s) => s.photo)?.photo ?? null, href: page ?? `/stays?village=${slug}` };
        })
        .filter((v) => v.count > 0)
        .sort((a, b) => a.dist - b.dist)
        .slice(0, 8)
    : [];
  const villageTitle = villageSlug ? villageName(villages, villageSlug, locale) : "";
  const landingList = isLanding ? landingStays(landingKey, stays, article?.relatedStays ?? []).sort(byPromotion) : [];
  const related = !isLanding && article?.relatedStays.length
    ? article.relatedStays.map((s) => stays.find((x) => x.slug === s)).filter((x): x is NonNullable<typeof x> => !!x).slice(0, 8)
    : [];
  const isReviewsPage = p === "/otzyvy" || p === "/otzyvy/s-foto";
  const reviews: (Review & { stay: StaySummary })[] = isReviewsPage ? await latestReviews(60) : [];
  const reviewsTotal = isReviewsPage ? (await getStayIndex()).reduce((n, s) => n + (s.reviewCount || 0), 0) : 0;

  const crumbSection = article && SECTIONS.find((s) => s !== "guide" && article.section === s);

  return (
    <section className="block pagesec">
      {article?.faq && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
          "@context": "https://schema.org", "@type": "FAQPage",
          mainEntity: article.faq.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
        }).replace(/</g, "\\u003c") }} />
      )}
      <div className="wrap">
        {(article?.section.startsWith("guide") || isGuideRoot) && (
          <div className="crumbs">
            <Link href="/guide">{t("nav.guide")}</Link>
            {crumbSection && crumbSection !== sectionKey && <> / <Link href={`/${crumbSection}`}>{t(`guide.sections.${crumbSection}`)}</Link></>}
          </div>
        )}
        <h1 style={{ fontSize: "clamp(24px,3.4vw,38px)", marginBottom: 18, maxWidth: "28ch" }}>{article ? article.h1 : t("guide.title")}</h1>
        {locale !== "ru" && article && <div className="notice">{t("guide.ruOnly")}</div>}

        {isGuideRoot && (
          <div style={{ display: "grid", gap: 34 }}>
            <p className="note" style={{ fontSize: 17, margin: 0 }}>{t("guide.lead")}</p>
            {SECTIONS.filter((s) => s !== "guide").map((s) => {
              const list = idx.filter((a) => a.section === s);
              if (!list.length) return null;
              return (
                <div key={s}>
                  <h2 style={{ fontSize: 22, marginBottom: 12 }}><Link href={`/${s}`}>{t(`guide.sections.${s}`)}</Link></h2>
                  <ul className="alist">{list.slice(0, 6).map((a) => <li key={a.path}><Link href={a.path}>{a.h1}</Link></li>)}</ul>
                </div>
              );
            })}
          </div>
        )}

        {article && villageSlug && (
          <div style={{ display: "grid", gap: 44 }}>
            <div>
              <div className="kicker">{t("guide.vStaysKicker")}</div>
              <h2 className="vsec">{t("guide.vStaysTitle", { name: villageTitle })}</h2>
              {villageStays.length > 0 ? (
                <>
                  <p className="note">{t("stays.found", { count: villageStays.length })}</p>
                  <div className="grid">{villageStays.map((s) => <StayCard key={s.slug} stay={s} villages={villages} />)}</div>
                </>
              ) : (
                <p className="note">{t("guide.vStaysNone")} <Link href="/stays">{t("home.seeAll")} →</Link></p>
              )}
            </div>
            <div style={{ display: "grid", gap: 24 }}>
              <div>
                <div className="kicker">{t("guide.vInfoKicker")}</div>
                <h2 className="vsec">{t("guide.vInfoTitle", { name: villageTitle })}</h2>
              </div>
              {article.html && <ArticleBody html={article.html} />}
              {article.albums?.length ? <ArticleAlbums albums={article.albums} name={villageTitle} /> : null}
            </div>
            {nearby.length > 0 && (
              <div>
                <div className="kicker">{t("guide.vNearKicker")}</div>
                <h2 className="vsec">{t("guide.vNearTitle")}</h2>
                <div className="villages">
                  {nearby.map((v, i) => (
                    <Link key={v.slug} className="vcard" href={v.href}>
                      {v.photo ? <Photo src={v.photo} alt={villageName(villages, v.slug, locale)} /> : <Scene seed={40 + i} mood={i % 4} horizon={200} />}
                      <span><b>{villageName(villages, v.slug, locale)}</b><small>{t("stays.found", { count: v.count })}</small></span>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {article && !villageSlug && (
          <div style={{ display: "grid", gap: 30 }}>
            {/* category landings: listings first, the SEO text at the end */}
            {isLanding && (
              <div>
                <p className="note">{t("stays.found", { count: landingList.length })}</p>
                <div className="grid">{landingList.map((s) => <StayCard key={s.slug} stay={s} villages={villages} />)}</div>
              </div>
            )}
            {article.html && <ArticleBody html={article.html} />}
            {article.albums?.length ? <ArticleAlbums albums={article.albums} name={article.h1} /> : null}
            {isSectionIndex && (
              <ul className="alist">
                {childrenOf(sectionKey, idx, p).map((a) => <li key={a.path}><Link href={a.path}>{a.h1}</Link></li>)}
              </ul>
            )}
            {related.length > 0 && !isReviewsPage && (
              <div>
                <h2 style={{ fontSize: 22, marginBottom: 12 }}>{t("guide.where")}</h2>
                <div className="grid">{related.map((s) => <StayCard key={s.slug} stay={s} villages={villages} />)}</div>
              </div>
            )}
            {reviews.length > 0 && (
              <>
                <p className="note" style={{ fontSize: 17, margin: 0 }}>{t("reviews.pageLead", { n: reviewsTotal.toLocaleString("ru-RU") })}</p>
                <div className="reviews">
                  {reviews.map((r) => (
                    <div key={r.id} className="rv-item">
                      <Link className="rv-stay" href={`/stays/${r.stay.slug}`}>
                        <span className="ph"><Photo src={r.stay.photo} alt={r.stay.name} seed={r.stay.name.length} /></span>
                        <span><b>{r.stay.name}</b><small>{t(`types.${r.stay.type}`)} · {villageName(villages, r.stay.village, locale)} · {t("reviews.allOf", { n: r.stay.reviewCount })}</small></span>
                      </Link>
                      <Reviews reviews={[r]} />
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
