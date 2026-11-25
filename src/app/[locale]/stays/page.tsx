import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import { VILLAGES, formatSom, getStays, type Amenity, type StayType } from "@/lib/data";
import { StayCard } from "@/components/StayCard";
import { LakeMap } from "@/components/LakeMap";
import { AutoSubmitForm } from "@/components/AutoSubmit";

const TYPES: StayType[] = ["hotel", "guest", "yurt", "cottage", "resort"];
const AMENITIES: Amenity[] = ["beach", "pool", "wifi", "breakfast", "parking", "kids", "sauna"];
const MAX_PRICE = 10000;

type Search = { village?: string; type?: string; max?: string; am?: string | string[]; view?: string };

export async function generateMetadata({ params }: { params: Promise<{ locale: Locale }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "stays" });
  return { title: t("title") };
}

export default async function StaysPage({ params, searchParams }: { params: Promise<{ locale: Locale }>; searchParams: Promise<Search> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const sp = await searchParams;
  const t = await getTranslations();

  const village = sp.village ?? "";
  const type = sp.type ?? "";
  const max = Math.min(Number(sp.max) || MAX_PRICE, MAX_PRICE);
  const am = (Array.isArray(sp.am) ? sp.am : sp.am ? [sp.am] : []) as Amenity[];
  const view = sp.view === "map" ? "map" : "list";

  const stays = (await getStays()).filter(
    (s) => (!village || s.village === village) && (!type || s.type === type) && s.priceFrom <= max && am.every((a) => s.amenities.includes(a)),
  );
  const base = locale === "ru" ? "/stays" : `/${locale}/stays`;
  const viewQuery = (v: string) => ({ ...sp, view: v });

  return (
    <section className="block">
      <div className="wrap">
        <div className="sec-head">
          <div><h1 style={{ fontSize: "clamp(22px,3vw,34px)" }}>{t("stays.title")}</h1><p>{t("stays.found", { count: stays.length })}</p></div>
          <div className="tabs">
            <Link href={{ pathname: "/stays", query: viewQuery("list") }} className={view === "list" ? "on" : undefined}>{t("stays.list")}</Link>
            <Link href={{ pathname: "/stays", query: viewQuery("map") }} className={view === "map" ? "on" : undefined}>{t("stays.map")}</Link>
          </div>
        </div>
        <div className="cat">
          <AutoSubmitForm className="filters" action={base}>
            {view === "map" && <input type="hidden" name="view" value="map" />}
            <div>
              <h4>{t("stays.village")}</h4>
              <select name="village" defaultValue={village}>
                <option value="">{t("home.anywhere")}</option>
                {VILLAGES.map((v) => <option key={v.slug} value={v.slug}>{v.name[locale]}</option>)}
              </select>
            </div>
            <div>
              <h4>{t("stays.type")}</h4>
              <div className="chips">
                <label className="chip"><input type="radio" name="type" value="" defaultChecked={!type} />{t("home.anyType")}</label>
                {TYPES.map((k) => (
                  <label key={k} className="chip"><input type="radio" name="type" value={k} defaultChecked={type === k} />{t(`types.${k}`)}</label>
                ))}
              </div>
            </div>
            <div>
              <h4>{t("stays.priceUpTo")}: {formatSom(max)} {t("som")}</h4>
              <input type="range" name="max" min={1500} max={MAX_PRICE} step={500} defaultValue={max} aria-label={t("stays.priceUpTo")} />
            </div>
            <div>
              <h4>{t("stays.amenities")}</h4>
              <div className="chips">
                {AMENITIES.map((k) => (
                  <label key={k} className="chip"><input type="checkbox" name="am" value={k} defaultChecked={am.includes(k)} />{t(`amenities.${k}`)}</label>
                ))}
              </div>
            </div>
            <Link className="btn ghost sm" href="/stays">{t("stays.reset")}</Link>
          </AutoSubmitForm>
          <div style={{ minWidth: 0 }}>
            {stays.length === 0 ? (
              <div className="empty">{t("stays.empty")}</div>
            ) : (
              <>
                {view === "map" && <div className="mapbox" style={{ marginBottom: 20 }}><LakeMap stays={stays} locale={locale} /></div>}
                <div className="grid">{stays.map((s) => <StayCard key={s.id} stay={s} />)}</div>
              </>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
