import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { routing, type Locale } from "@/i18n/routing";
import { formatSom, getStay, getStays, getVillage, seasonPrices, showsDirectContacts } from "@/lib/data";
import { Scene } from "@/components/Scene";
import { LakeMap } from "@/components/LakeMap";
import { ContactButtons } from "@/components/ContactButtons";

type P = { params: Promise<{ locale: Locale; slug: string }> };

export async function generateStaticParams() {
  const stays = await getStays();
  return routing.locales.flatMap((locale) => stays.map((s) => ({ locale, slug: s.slug })));
}

export async function generateMetadata({ params }: P): Promise<Metadata> {
  const { locale, slug } = await params;
  const stay = await getStay(slug);
  if (!stay) return {};
  const v = getVillage(stay.village);
  return { title: `${stay.name} — ${v.name[locale]}`, description: stay.description[locale] };
}

export default async function StayPage({ params }: P) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const stay = await getStay(slug);
  if (!stay) notFound();
  const t = await getTranslations();
  const v = getVillage(stay.village);
  const seasons = seasonPrices(stay.priceFrom);

  return (
    <section className="block pagesec">
      <div className="wrap">
        <div className="crumbs"><Link href="/stays">{t("nav.stays")}</Link> / <Link href={{ pathname: "/stays", query: { village: v.slug } }}>{v.name[locale]}</Link></div>
        <div className="gallery">
          {[0, 1, 2, 3, 4].map((i) => (
            <div key={i}><Scene seed={stay.id * 11 + i * 3} mood={(stay.mood + i) % 4} yurt={stay.type === "yurt" && i % 2 === 0} horizon={200 + i * 12} /></div>
          ))}
        </div>
        <div className="listing">
          <div style={{ display: "grid", gap: 26, minWidth: 0 }}>
            <div>
              <div className="meta" style={{ color: "var(--muted)", fontWeight: 700, fontSize: 14 }}>
                {t(`types.${stay.type}`)} · {v.name[locale]} · {t(`shore.${v.shore}`)} · ★ {stay.rating.toFixed(1)}
              </div>
              <h1 style={{ marginTop: 6 }}>{stay.name}</h1>
            </div>
            <div><h2 style={{ fontSize: 18, marginBottom: 8 }}>{t("stay.about")}</h2><p style={{ margin: 0, maxWidth: "65ch" }}>{stay.description[locale]}</p></div>
            <div>
              <h2 style={{ fontSize: 18, marginBottom: 10 }}>{t("stay.amenities")}</h2>
              <ul className="amen">{stay.amenities.map((a) => <li key={a}>{t(`amenities.${a}`)}</li>)}</ul>
            </div>
            <div>
              <h2 style={{ fontSize: 18, marginBottom: 10 }}>{t("stay.location")}</h2>
              <div className="mapbox"><LakeMap stays={[stay]} locale={locale} highlight={stay.id} /></div>
              <p className="note">{t("stay.kmFromBishkek", { km: v.kmFromBishkek })}</p>
            </div>
          </div>
          <aside className="contact">
            <div className="host">
              <div className="ava">{stay.hostName[0]}</div>
              <div><b>{stay.hostName}</b><div className="note">{t("stay.since", { year: stay.listedSince })} · {t("stay.replies")}</div></div>
            </div>
            <div><span className="big">{formatSom(stay.priceFrom)} {t("som")}</span> <span className="note">{t("stay.perNight")}</span></div>
            <table className="season">
              <caption style={{ textAlign: "left", fontWeight: 700, marginBottom: 4 }}>{t("stay.seasonPrices")}</caption>
              <tbody>
                {seasons.map((p, i) => (
                  <tr key={i}><td>{t(`stay.season${i + 1}`)}</td><td>{formatSom(p)} {t("som")}</td></tr>
                ))}
              </tbody>
            </table>
            {showsDirectContacts(stay) ? (
              <>
                <ContactButtons kind="stay" id={stay.id} phone={stay.phone} whatsapp={stay.whatsapp} telegram={stay.telegram}
                  labels={{ whatsapp: t("stay.whatsapp"), telegram: t("stay.telegram"), showPhone: t("stay.showPhone") }} />
                <p className="note" style={{ margin: 0 }}>{t("stay.direct")}</p>
              </>
            ) : (
              <>
                <p className="note" style={{ margin: 0 }}>{t("stay.noDirect")}</p>
                <button className="btn" disabled>{t("stay.request")}</button>
              </>
            )}
          </aside>
        </div>
      </div>
    </section>
  );
}
