import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import { STAY_TYPES, byPromotion, getStayIndex, getVillages, type StayType } from "@/lib/content";
import { Money } from "@/components/Currency";
import { LakeMap } from "@/components/LakeMap";
import { AutoSubmitForm } from "@/components/AutoSubmit";
import { StayList } from "@/components/StayList";

const MAX_PRICE = 20000;
type Search = { village?: string; type?: string; max?: string; view?: string; page?: string };

export async function generateMetadata({ params, searchParams }: { params: Promise<{ locale: Locale }>; searchParams: Promise<Search> }): Promise<Metadata> {
  const { locale } = await params;
  const sp = await searchParams;
  const t = await getTranslations({ locale, namespace: "stays" });
  const filtered = !!(sp.village || sp.type || sp.max || sp.view || sp.page);
  return {
    title: t("title"),
    alternates: { canonical: locale === "ru" ? "/stays" : `/${locale}/stays` },
    robots: filtered ? { index: false, follow: true } : undefined,
  };
}

export default async function StaysPage({ params, searchParams }: { params: Promise<{ locale: Locale }>; searchParams: Promise<Search> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const sp = await searchParams;
  const t = await getTranslations();
  const [all, villages] = await Promise.all([getStayIndex(), getVillages()]);

  const village = sp.village ?? "";
  const type = (sp.type ?? "") as StayType | "";
  const max = Math.min(Number(sp.max) || MAX_PRICE, MAX_PRICE);
  const view = sp.view === "map" ? "map" : "list";
  const stays = all
    .filter((s) => (!village || s.village === village) && (!type || s.type === type) && (max >= MAX_PRICE || (s.priceFrom ?? 0) <= max))
    .sort(byPromotion);
  const base = locale === "ru" ? "/stays" : `/${locale}/stays`;
  const query: Record<string, string> = {};
  for (const [k, v] of Object.entries({ village, type, max: sp.max, view: sp.view })) if (v) query[k] = String(v);
  const withStays = villages.filter((v) => all.some((s) => s.village === v.slug));

  return (
    <section className="block">
      <div className="wrap">
        <div className="sec-head">
          <div><h1 style={{ fontSize: "clamp(22px,3vw,34px)" }}>{t("stays.title")}</h1><p>{t("stays.found", { count: stays.length })}</p></div>
          <div className="tabs">
            <Link href={{ pathname: "/stays", query: { ...query, view: undefined } }} className={view === "list" ? "on" : undefined}>{t("stays.list")}</Link>
            <Link href={{ pathname: "/stays", query: { ...query, view: "map" } }} className={view === "map" ? "on" : undefined}>{t("stays.map")}</Link>
          </div>
        </div>
        <div className="cat">
          <AutoSubmitForm className="filters" action={base}>
            {view === "map" && <input type="hidden" name="view" value="map" />}
            <div>
              <h4>{t("stays.village")}</h4>
              <select name="village" defaultValue={village}>
                <option value="">{t("home.anywhere")}</option>
                {withStays.map((v) => <option key={v.slug} value={v.slug}>{v.name[locale]}</option>)}
              </select>
            </div>
            <div>
              <h4>{t("stays.type")}</h4>
              <div className="chips">
                <label className="chip"><input type="radio" name="type" value="" defaultChecked={!type} />{t("home.anyType")}</label>
                {STAY_TYPES.map((k) => (
                  <label key={k} className="chip"><input type="radio" name="type" value={k} defaultChecked={type === k} />{t(`types.${k}`)}</label>
                ))}
              </div>
            </div>
            <div>
              <h4>{t("stays.priceUpTo")}: {max >= MAX_PRICE ? "∞" : <Money som={max} />}</h4>
              <input type="range" name="max" min={500} max={MAX_PRICE} step={500} defaultValue={max} aria-label={t("stays.priceUpTo")} />
            </div>
            <Link className="btn ghost sm" href="/stays">{t("stays.reset")}</Link>
          </AutoSubmitForm>
          <div style={{ minWidth: 0 }}>
            {view === "map" && <div className="mapbox" style={{ marginBottom: 20 }}><LakeMap stays={stays} villages={villages} locale={locale} highlight={village || null} /></div>}
            <StayList stays={stays} villages={villages} page={Number(sp.page) || 1} pathname="/stays" query={query} />
          </div>
        </div>
      </div>
    </section>
  );
}
