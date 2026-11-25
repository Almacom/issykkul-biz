import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import { VILLAGES, getStays, getVillage } from "@/lib/data";
import { Scene } from "@/components/Scene";
import { StayCard } from "@/components/StayCard";

const FEATURED_VILLAGES = ["cholpon-ata", "bosteri", "karakol", "bokonbaevo"];
const TYPES = ["hotel", "guest", "yurt", "cottage", "resort"] as const;

export default async function Home({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations();
  const stays = await getStays();

  return (
    <>
      <section className="hero">
        <Scene seed={5} mood={0} horizon={250} className="scene" />
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
                {VILLAGES.map((v) => <option key={v.slug} value={v.slug}>{v.name[locale]}</option>)}
              </select>
            </label>
            <label>
              {t("home.type")}
              <select name="type" defaultValue="">
                <option value="">{t("home.anyType")}</option>
                {TYPES.map((k) => <option key={k} value={k}>{t(`types.${k}`)}</option>)}
              </select>
            </label>
            <button className="btn" type="submit">{t("home.search")}</button>
          </form>
          <div className="facts">
            <div><b>1 607 м</b>{t("home.factAlt")}</div>
            <div><b>182 км</b>{t("home.factLen")}</div>
            <div><b>+22 °C</b>{t("home.factWater")}</div>
            <div><b>{stays.length}</b>{t("home.factCount")}</div>
          </div>
        </div>
      </section>

      <section className="block">
        <div className="wrap">
          <div className="sec-head"><div><h2>{t("home.howTitle")}</h2><p>{t("home.howLead")}</p></div></div>
          <div className="how">
            {[1, 2, 3].map((i) => (
              <div key={i}>
                <div className="n">0{i}</div>
                <h3>{t(`home.how${i}t`)}</h3>
                <p>{t(`home.how${i}`)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="block sec-tight">
        <div className="wrap">
          <div className="sec-head"><div><h2>{t("home.popular")}</h2></div><Link className="btn ghost sm" href="/stays">{t("home.seeAll")} →</Link></div>
          <div className="grid">{stays.slice(0, 4).map((s) => <StayCard key={s.id} stay={s} />)}</div>
        </div>
      </section>

      <section className="block sec-tight">
        <div className="wrap">
          <div className="sec-head"><div><h2>{t("home.shoreTitle")}</h2><p>{t("home.shoreLead")}</p></div></div>
          <div className="villages">
            {FEATURED_VILLAGES.map((slug, i) => {
              const v = getVillage(slug);
              return (
                <Link key={slug} className="vcard" href={{ pathname: "/stays", query: { village: slug } }}>
                  <Scene seed={31 + i * 13} mood={v.mood} yurt={slug === "bokonbaevo"} horizon={200} />
                  <span><b>{v.name[locale]}</b><small>{t(`shore.${v.shore}`)} · {t("stay.kmFromBishkek", { km: v.kmFromBishkek })}</small></span>
                </Link>
              );
            })}
          </div>
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
