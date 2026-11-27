import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import { IMAGE_BASE, STAY_TYPES, byPromotion, getArticleIndex, getStayIndex, getVillages } from "@/lib/content";
import { Scene } from "@/components/Scene";
import { StayCard } from "@/components/StayCard";
import { Photo } from "@/components/Photo";

/** The site has worked since 2010 (17 years at the 2027 relaunch); grows by itself every year. */
const SITE_YEARS = Math.max(17, new Date().getFullYear() - 2010);

const FEATURED_VILLAGES = ["cholpon-ata", "bosteri", "karakol", "kadzhi-say"];

/** Real photos for the village cards (own photos from the old site or free-licensed ones); others keep the drawn scene. */
const VILLAGE_PHOTOS: Record<string, string> = {
  bosteri: "/portals/0/bosteri-koleso-obozrenie.jpg",
  "cholpon-ata": "/site/cholpon-ata-800.jpg",
  karakol: "/site/karakol-800.jpg",
  "kadzhi-say": "/site/kadzhi-say-800.jpg",
};

export default async function Home({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations();
  const [stays, villages, articles] = await Promise.all([getStayIndex(), getVillages(), getArticleIndex()]);
  const top = [...stays].sort(byPromotion).slice(0, 8);
  const reviewsTotal = stays.reduce((n, s) => n + (s.reviewCount || 0), 0);
  const withStays = villages.filter((v) => stays.some((s) => s.village === v.slug));
  const guides = articles.filter((a) => a.section === "guide/sela" || a.section === "guide/ekskursii").slice(0, 6);

  return (
    <>
      <section className="hero">
        {/* Lake Issyk-Kul near Cholpon-Ata, photo by Bgag, CC0 (Wikimedia Commons). Stored in R2 under site/. */}
        <picture className="scene">
          <source type="image/webp" srcSet={`${IMAGE_BASE}/site/hero-1000.webp 1000w, ${IMAGE_BASE}/site/hero-1920.webp 1920w`} sizes="100vw" />
          <img src={`${IMAGE_BASE}/site/hero-1920.jpg`} srcSet={`${IMAGE_BASE}/site/hero-1000.jpg 1000w, ${IMAGE_BASE}/site/hero-1920.jpg 1920w`} sizes="100vw" alt={t("home.eyebrow")} fetchPriority="high" />
        </picture>
        <div className="shade" />
        <div className="wrap">
          <div className="eyebrow">{t("home.eyebrow")}</div>
          <h1>{t("home.title")}</h1>
          <p className="lead">{t("home.lead")}</p>
          <form className="search" action={locale === "ru" ? "/stays" : `/${locale}/stays`} method="get">
            <label>
              {t("home.where")}
              <select name="village" defaultValue="">
                <option value="">{t("home.anywhere")}</option>
                {withStays.map((v) => <option key={v.slug} value={v.slug}>{v.name[locale]}</option>)}
              </select>
            </label>
            <label>
              {t("home.type")}
              <select name="type" defaultValue="">
                <option value="">{t("home.anyType")}</option>
                {STAY_TYPES.map((k) => <option key={k} value={k}>{t(`types.${k}`)}</option>)}
              </select>
            </label>
            <button className="btn" type="submit">{t("home.search")}</button>
          </form>
          <div className="facts">
            <div><b>{t("home.factYearsN", { n: SITE_YEARS })}</b>{t("home.factYears")}</div>
            <div><b>1 607 м</b>{t("home.factAlt")}</div>
            <div><b>182 км</b>{t("home.factLen")}</div>
            <div><b>{stays.length}</b>{t("home.factCount")}</div>
            <div><b>{reviewsTotal.toLocaleString("ru-RU")}</b>{t("nav.reviews").toLowerCase()}</div>
          </div>
        </div>
      </section>

      <section className="block">
        <div className="wrap">
          <div className="sec-head"><div><h2>{t("home.popular")}</h2></div><Link className="btn ghost sm" href="/stays">{t("home.seeAll")} →</Link></div>
          <div className="grid">{top.map((s) => <StayCard key={s.slug} stay={s} villages={villages} />)}</div>
        </div>
      </section>

      <section className="block sec-tight">
        <div className="wrap">
          <div className="sec-head"><div><h2>{t("home.howTitle")}</h2><p>{t("home.howLead")}</p></div></div>
          <div className="how">
            {[1, 2, 3].map((i) => (
              <div key={i}><div className="n">0{i}</div><h3>{t(`home.how${i}t`)}</h3><p>{t(`home.how${i}`)}</p></div>
            ))}
          </div>
        </div>
      </section>

      <section className="block sec-tight">
        <div className="wrap">
          <div className="sec-head"><div><h2>{t("home.shoreTitle")}</h2><p>{t("home.shoreLead")}</p></div></div>
          <div className="villages">
            {FEATURED_VILLAGES.map((slug, i) => {
              const v = villages.find((x) => x.slug === slug);
              if (!v) return null;
              const n = stays.filter((s) => s.village === slug).length;
              return (
                <Link key={slug} className="vcard" href={{ pathname: "/stays", query: { village: slug } }}>
                  {VILLAGE_PHOTOS[slug]
                    ? <Photo src={VILLAGE_PHOTOS[slug]} alt={v.name[locale]} />
                    : <Scene seed={31 + i * 13} mood={i % 4} horizon={200} />}
                  <span><b>{v.name[locale]}</b><small>{t(`shore.${v.shore}`)} · {t("stays.found", { count: n })}</small></span>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {guides.length > 0 && (
        <section className="block sec-tight">
          <div className="wrap">
            <div className="sec-head"><div><h2>{t("guide.title")}</h2><p>{t("guide.lead")}</p></div><Link className="btn ghost sm" href="/guide">{t("guide.all")} →</Link></div>
            <ul className="alist">{guides.map((a) => <li key={a.path}><Link href={a.path}>{a.h1}</Link></li>)}</ul>
          </div>
        </section>
      )}

      <section className="block sec-tight">
        <div className="wrap">
          <div className="cta">
            <div>
              <h2>{t("home.ctaTitle")}</h2>
              <p>{t("home.ctaLead")}</p>
              <p><Link className="btn sand" href="/pricing">{t("home.ctaButton")} →</Link></p>
            </div>
            <div className="nums">
              <div><b>0%</b>{t("home.cta1")}</div>
              <div><b>{t("home.cta2v")}</b>{t("home.cta2")}</div>
              <div><b>{t("home.cta3v")}</b>RU · EN · KG</div>
              <div><b>{t("home.cta4v")}</b>{t("home.cta4")}</div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
