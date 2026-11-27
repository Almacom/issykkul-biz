import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import { IMAGE_BASE, STAY_TYPES, byPromotion, getArticleIndex, getStayIndex, getVillages } from "@/lib/content";
import { Scene } from "@/components/Scene";
import { StayCard } from "@/components/StayCard";
import { LANDINGS } from "@/lib/landings";
import { Photo } from "@/components/Photo";

/** The site has worked since 2010 (17 years at the 2027 relaunch); grows by itself every year. */
const SITE_YEARS = Math.max(17, new Date().getFullYear() - 2010);

/** Category landing page for each stay type (e.g. guest → /chastnyy-sektor). */
const TYPE_LANDING: Record<string, string> = Object.fromEntries(
  Object.entries(LANDINGS).filter(([, l]) => l.types?.length === 1 && !l.village).map(([slug, l]) => [l.types![0], slug]),
);

/** Photo per accommodation category that shows what it is (picked from the listings' own grounds albums). */
const CATEGORY_PHOTOS: Record<string, string> = {
  guest: "/portals/0/gha_imgs/adilet-dvor/dvor-gostevoy-dom-adilet-na-issyk-kule-17_56.jpg",
  cottage: "/portals/0/gha_imgs/sanrayz-villas-v-pansionate-kolumb/vid-kottedzha-sanrayz-villas41_662.jpg",
  pansionat: "/portals/0/gha_imgs/vavilon-territoriya/lyuks-2-kh-mestnyy-v-domakh-pansionat-vavilon-na-issyk-kule6.jpg_851_34.jpg",
  hotel: "/portals/0/gha_imgs/delfin/%D0%B4%D0%B5%D0%BB%D1%8C%D1%84%D0%B8%D0%BD%20%D0%B4%D0%B5%20%D0%BB%D1%8E%D0%BA%D1%81%201.jpg",
  minipansionat: "/portals/0/gha_imgs/valencia/valencia1.jpg",
  resort: "/portals/0/gha_imgs/capriz/capriz2.jpg",
  sanatorium: "/portals/0/gha_imgs/goluboi-issykkul/stolovaya-goluboi-issykkul-14_242.jpg",
};

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
  // Home "Popular with tourists": Premium listings only once there are enough of them (a paid perk);
  // until then Premium first, the rest filled by number of reviews and rating.
  const sorted = [...stays].sort(byPromotion);
  const premium = sorted.filter((s) => s.plan === "premium");
  const top = (premium.length >= 4 ? premium : sorted).slice(0, 8);
  // Recently added: newest old-site ids first (DB created_at once owners add listings), not repeating the popular block.
  const topSlugs = new Set(top.map((s) => s.slug));
  const newest = [...stays].filter((s) => !topSlugs.has(s.slug)).sort((a, b) => (b.addedAt ?? "").localeCompare(a.addedAt ?? "") || (b.oldId ?? 0) - (a.oldId ?? 0)).slice(0, 8);
  // Categories: count per type, photo = cover of the most reviewed listing of that type, link = category landing.
  const categories = STAY_TYPES.map((type) => {
    const list = stays.filter((s) => s.type === type);
    const best = [...list].filter((s) => s.photo).sort((a, b) => (b.reviewCount ?? 0) - (a.reviewCount ?? 0))[0];
    return { type, count: list.length, photo: CATEGORY_PHOTOS[type] ?? best?.photo ?? null, href: TYPE_LANDING[type] ? `/${TYPE_LANDING[type]}` : `/stays?type=${type}` };
  }).filter((c) => c.count > 0).sort((a, b) => b.count - a.count);
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
          <div className="sec-head"><div><div className="kicker">{t("home.catEyebrow")}</div><h2>{t("home.catTitle")}</h2></div></div>
          <div className="cats">
            {categories.map((c, i) => (
              <Link key={c.type} className="cat" href={c.href}>
                <div className="ph"><Photo src={c.photo} alt={t(`types.${c.type}`)} seed={i + 3} /></div>
                <b>{t(`home.cat.${c.type}`)}</b>
                <span>{t("home.catCount", { n: c.count })}</span>
              </Link>
            ))}
            <Link className="cat" href="/stays">
              <div className="ph"><Photo src="/site/hero-1000.jpg" alt={t("home.catAll")} /></div>
              <b>{t("home.catAll")}</b>
              <span>{t("home.catCount", { n: stays.length })}</span>
            </Link>
          </div>
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
          <div className="sec-head">
            <div><h2>{t("home.shoreTitle")}</h2><p>{t("home.shoreLead")}</p></div>
            <div className="lake-facts">
              <span><b>1 607 м</b> {t("home.factAlt")}</span>
              <span><b>182 км</b> {t("home.factLen")}</span>
            </div>
          </div>
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
          <div className="sec-head"><div><div className="kicker">{t("home.newEyebrow")}</div><h2>{t("home.newTitle")}</h2></div><Link className="btn ghost sm" href="/stays">{t("home.seeAll")} →</Link></div>
          <div className="grid">{newest.map((s) => <StayCard key={s.slug} stay={s} villages={villages} />)}</div>
        </div>
      </section>

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
