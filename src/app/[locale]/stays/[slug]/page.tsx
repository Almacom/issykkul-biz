import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { routing, type Locale } from "@/i18n/routing";
import { getReviews, getStayBySlug, getStayIndex, getVillages, img, villageName, withImageBase } from "@/lib/content";
import { LANDINGS } from "@/lib/landings";
import { FromPrice, Money } from "@/components/Currency";
import { StayFeatures } from "@/components/StayFeatures";
import { ReviewForm } from "@/components/ReviewForm";
import { GalleryViewer, type PhotoGroup } from "@/components/GalleryViewer";
import { SITE_URL } from "@/lib/site";
import { Photo } from "@/components/Photo";
import { LakeMap } from "@/components/LakeMap";
import { ContactButtons } from "@/components/ContactButtons";
import { Reviews } from "@/components/Reviews";

type P = { params: Promise<{ locale: Locale; slug: string }> };
export const dynamicParams = false;

/** Rating → word, like booking sites: 4.5+ excellent, 4+ very good, 3.5+ good. */
const ratingWord = (r: number) => (r >= 4.5 ? "excellent" : r >= 4 ? "veryGood" : r >= 3.5 ? "good" : "ok");

export async function generateStaticParams() {
  const stays = await getStayIndex();
  return routing.locales.flatMap((locale) => stays.map((s) => ({ locale, slug: s.slug })));
}

const TYPE_LANDING: Record<string, string> = Object.fromEntries(
  Object.entries(LANDINGS).filter(([, l]) => l.types?.length === 1 && !l.village).map(([slug, l]) => [l.types![0], slug]),
);

export async function generateMetadata({ params }: P): Promise<Metadata> {
  const { locale, slug } = await params;
  const s = await getStayBySlug(slug);
  if (!s) return {};
  const ru = locale === "ru";
  return {
    title: { absolute: ru ? s.seoTitle : `${s.name} — Issyk-Kul` },
    description: ru ? s.seoDescription : undefined,
    alternates: { canonical: `/stays/${slug}` },
    robots: ru ? undefined : { index: false, follow: true },
    openGraph: { images: s.photos[0] ? [img(s.photos[0])!] : undefined },
  };
}

export default async function StayPage({ params }: P) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const [stay, villages, reviews] = await Promise.all([getStayBySlug(slug), getVillages(), getReviews(slug)]);
  if (!stay) notFound();
  const t = await getTranslations();
  const vName = villageName(villages, stay.village, locale);
  const v = villages.find((x) => x.slug === stay.village);
  const landing = TYPE_LANDING[stay.type];
  const gallery = stay.photos.slice(0, 5);
  const groups: PhotoGroup[] = [
    ...(stay.albums ?? []).map((a) => ({ title: a.title, urls: a.photos.map((p) => img(p)!) })),
    ...stay.rooms.filter((r) => r.photos.length).map((r) => ({ title: r.name, urls: r.photos.map((p) => img(p)!) })),
  ];

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": stay.type === "hotel" ? "Hotel" : "LodgingBusiness",
    name: stay.name,
    description: stay.seoDescription,
    url: `${SITE_URL}/stays/${slug}`,
    image: stay.photos.slice(0, 5).map((p) => img(p)),
    address: { "@type": "PostalAddress", addressLocality: vName, addressRegion: "Иссык-Кульская область", addressCountry: "KG" },
    priceRange: stay.priceFrom ? `от ${stay.priceFrom} KGS` : undefined,
    aggregateRating: stay.reviewCount && stay.rating
      ? { "@type": "AggregateRating", ratingValue: stay.rating, reviewCount: stay.reviewCount, bestRating: 5, worstRating: 1 }
      : undefined,
    review: reviews.slice(0, 5).map((r) => ({
      "@type": "Review", author: { "@type": "Person", name: r.author || "Гость" }, datePublished: r.date || undefined,
      name: r.title || undefined, reviewBody: r.text, reviewRating: r.rating ? { "@type": "Rating", ratingValue: r.rating, bestRating: 5, worstRating: 1 } : undefined,
    })),
  };

  return (
    <section className="block pagesec">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      <div className="wrap">
        <div className="crumbs">
          <Link href="/stays">{t("nav.stays")}</Link>
          {landing && <> / <Link href={`/${landing}`}>{t(`types.${stay.type}`)}</Link></>}
          {v && <> / <Link href={{ pathname: "/stays", query: { village: v.slug } }}>{vName}</Link></>}
        </div>
        <GalleryViewer groups={groups} name={stay.name}>
          <div className="gallery">
            {(gallery.length ? gallery : [null, null, null, null, null]).map((p, i) => (
              <div key={i} data-i={p ? groups.flatMap((g) => g.urls).indexOf(img(p)!) : undefined}>
                <Photo src={p} alt={`${stay.name} — ${i + 1}`} seed={i + stay.name.length} eager={i === 0} />
              </div>
            ))}
          </div>
        </GalleryViewer>
        <div className="listing">
          <div style={{ display: "grid", gap: 26, minWidth: 0 }}>
            <div className="stay-head">
              <div>
                <div className="meta" style={{ color: "var(--muted)", fontWeight: 700, fontSize: 14 }}>
                  {t(`types.${stay.type}`)} · {vName}{v ? ` · ${t(`shore.${v.shore}`)}` : ""}
                </div>
                <h1 style={{ marginTop: 6 }}>{locale === "ru" ? stay.h1 : stay.name}</h1>
              </div>
              <div className="head-side">
              {stay.reviewCount > 0 && stay.rating ? (
                <a className="rating-box" href="#reviews">
                  <span className="rb-label">{t("stay.ratingBased", { n: stay.reviewCount })}</span>
                  <span className="rb-main">
                    <b>{t(`stay.ratingWord.${ratingWord(stay.rating)}`)} {stay.rating.toFixed(1).replace(".", locale === "en" ? "." : ",")}/5</b>
                    <span className="stars" style={{ ["--fill" as string]: `${(stay.rating / 5) * 100}%` }} aria-hidden="true">★★★★★</span>
                  </span>
                </a>
              ) : null}
                <a className="write-review" href="#write-review">
                  <span>{t("reviewForm.stayed")}</span>
                  <b>✎ {t("reviewForm.open")}</b>
                </a>
              </div>
            </div>
            {locale !== "ru" && <div className="notice">{t("guide.ruOnly")}</div>}
            <div className="prose" dangerouslySetInnerHTML={{ __html: withImageBase(stay.descriptionHtml) }} />
            {stay.info && <StayFeatures info={stay.info} />}
            {stay.rooms.length > 0 && (
              <div>
                <h2 style={{ fontSize: 22, marginBottom: 10 }}>{t("stay.rooms")}</h2>
                {stay.priceNote && <p className="notice" style={{ whiteSpace: "pre-line" }}>{stay.priceNote}</p>}
                <div className="rooms">
                  {stay.rooms.map((r, i) => (
                    <div key={i} className={`room${r.photos.length ? "" : " noph"}`}>
                      {r.photos.length > 0 && (
                        <GalleryViewer groups={[{ title: r.name, urls: r.photos.map((p) => img(p)!) }]} name={stay.name} compact>
                          <div className="rph" data-i={0}><Photo src={r.photos[0]} alt={r.name} /></div>
                        </GalleryViewer>
                      )}
                      <div>
                        <h3>{r.name}</h3>
                        {r.description && <p className="note" style={{ margin: 0 }}>{r.description}</p>}
                        <div className="prices">
                          {r.prices.length ? r.prices.map((p, j) => (
                            <div key={j}><span>{p.period}</span><b><Money som={p.price} /> <small className="note">/ {p.per}</small></b></div>
                          )) : <div><span>{t("stay.priceOnRequest")}</span></div>}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {stay.foodHtml && (
              <div>
                <h2 style={{ fontSize: 22, marginBottom: 10 }}>{t("stay.food")}</h2>
                <div className="prose" dangerouslySetInnerHTML={{ __html: withImageBase(stay.foodHtml) }} />
              </div>
            )}
            <div>
              <h2 style={{ fontSize: 22, marginBottom: 10 }}>{t("stay.location")}</h2>
              <div className="mapbox"><LakeMap stays={[]} villages={villages} locale={locale} highlight={stay.village} /></div>
            </div>
            <div>
              <h2 id="reviews" style={{ fontSize: 22, marginBottom: 10, scrollMarginTop: 90 }}>{t("stay.reviews")}{reviews.length ? ` (${stay.reviewCount})` : ""}</h2>
              {reviews.length > 0 ? <Reviews reviews={reviews} /> : <p className="note">{t("reviewForm.first")}</p>}
              <div style={{ marginTop: 16 }}><ReviewForm slug={slug} /></div>
            </div>
          </div>
          <aside className="contact">
            <div>
              {stay.priceFrom
                ? <><span className="big">{<FromPrice text={t("stay.from", { price: "@@P@@" })} som={stay.priceFrom!} />}</span> <span className="note">{t("stay.perNight")}</span></>
                : <span className="big" style={{ fontSize: 20 }}>{t("stay.priceOnRequest")}</span>}
            </div>
            <ContactButtons kind="stay" id={slug} live={slug} phone={stay.phone ?? stay.whatsapp} whatsapp={stay.whatsapp} telegram={stay.telegram}
              waText={t("stay.waText", { name: stay.name })}
              labels={{ whatsapp: t("stay.askWa"), telegram: t("stay.telegram"), showPhone: t("stay.showPhone") }} />
            <p className="note" style={{ margin: 0 }}>{stay.directContacts === false ? t("stay.viaAgency") : t("stay.direct")}</p>
          </aside>
        </div>
      </div>
    </section>
  );
}
