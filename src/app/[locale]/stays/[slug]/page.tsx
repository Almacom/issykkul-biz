import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { routing, type Locale } from "@/i18n/routing";
import { getReviews, getStayBySlug, getStayIndex, getVillages, img, villageName, withImageBase } from "@/lib/content";
import { LANDINGS } from "@/lib/landings";
import { formatSom } from "@/lib/data";
import { SITE_URL } from "@/lib/site";
import { Photo } from "@/components/Photo";
import { LakeMap } from "@/components/LakeMap";
import { ContactButtons } from "@/components/ContactButtons";
import { Reviews } from "@/components/Reviews";

type P = { params: Promise<{ locale: Locale; slug: string }> };
export const dynamicParams = false;

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
        <div className="gallery">
          {(gallery.length ? gallery : [null, null, null, null, null]).map((p, i) => (
            <div key={i}><Photo src={p} alt={`${stay.name} — ${i + 1}`} seed={i + stay.name.length} eager={i === 0} /></div>
          ))}
        </div>
        {stay.photos.length > 5 && <p className="note">{t("stay.photosN", { n: stay.photos.length })}</p>}
        <div className="listing">
          <div style={{ display: "grid", gap: 26, minWidth: 0 }}>
            <div>
              <div className="meta" style={{ color: "var(--muted)", fontWeight: 700, fontSize: 14 }}>
                {t(`types.${stay.type}`)} · {vName}{v ? ` · ${t(`shore.${v.shore}`)}` : ""}
                {stay.reviewCount > 0 && stay.rating ? ` · ★ ${stay.rating.toFixed(2)} (${t("stay.reviewsN", { n: stay.reviewCount })})` : ""}
              </div>
              <h1 style={{ marginTop: 6 }}>{locale === "ru" ? stay.h1 : stay.name}</h1>
            </div>
            {locale !== "ru" && <div className="notice">{t("guide.ruOnly")}</div>}
            <div className="prose" dangerouslySetInnerHTML={{ __html: withImageBase(stay.descriptionHtml) }} />
            {stay.rooms.length > 0 && (
              <div>
                <h2 style={{ fontSize: 22, marginBottom: 10 }}>{t("stay.rooms")}</h2>
                {stay.priceNote && <p className="notice" style={{ whiteSpace: "pre-line" }}>{stay.priceNote}</p>}
                <div className="rooms">
                  {stay.rooms.map((r, i) => (
                    <div key={i} className={`room${r.photos.length ? "" : " noph"}`}>
                      {r.photos.length > 0 && <div className="rph"><Photo src={r.photos[0]} alt={r.name} /></div>}
                      <div>
                        <h3>{r.name}</h3>
                        {r.description && <p className="note" style={{ margin: 0 }}>{r.description}</p>}
                        <div className="prices">
                          {r.prices.length ? r.prices.map((p, j) => (
                            <div key={j}><span>{p.period}</span><b>{formatSom(p.price)} {t("som")} <small className="note">/ {p.per}</small></b></div>
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
            {reviews.length > 0 && (
              <div>
                <h2 style={{ fontSize: 22, marginBottom: 10 }}>{t("stay.reviews")} ({stay.reviewCount})</h2>
                <Reviews reviews={reviews} />
              </div>
            )}
          </div>
          <aside className="contact">
            <div>
              {stay.priceFrom
                ? <><span className="big">{t("stay.from", { price: formatSom(stay.priceFrom) })}</span> <span className="note">{t("stay.perNight")}</span></>
                : <span className="big" style={{ fontSize: 20 }}>{t("stay.priceOnRequest")}</span>}
            </div>
            <ContactButtons kind="stay" id={slug} phone={stay.whatsapp} whatsapp={stay.whatsapp}
              waText={t("stay.waText", { name: stay.name })}
              labels={{ whatsapp: t("stay.askWa"), telegram: t("stay.telegram"), showPhone: t("stay.showPhone") }} />
            <p className="note" style={{ margin: 0 }}>{t("stay.direct")}</p>
          </aside>
        </div>
      </div>
    </section>
  );
}
