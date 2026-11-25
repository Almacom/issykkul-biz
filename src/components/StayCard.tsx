import { getLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import { formatSom, getVillage, type Stay } from "@/lib/data";
import { Scene } from "./Scene";

export async function StayCard({ stay }: { stay: Stay }) {
  const t = await getTranslations();
  const locale = (await getLocale()) as Locale;
  const v = getVillage(stay.village);
  return (
    <Link className="card" href={`/stays/${stay.slug}`}>
      <div className="ph">
        <Scene seed={stay.id * 7} mood={stay.mood} yurt={stay.type === "yurt"} />
        {stay.plan === "premium" && <span className="badge">{t("stay.premium")}</span>}
        {stay.verified && <span className="badge ver">✓ {t("stay.verified")}</span>}
      </div>
      <div className="body">
        <div className="meta">{t(`types.${stay.type}`)} · {v.name[locale]}</div>
        <h3>{stay.name}</h3>
        <div className="row">
          <span className="price">{t("stay.from", { price: formatSom(stay.priceFrom) })} <small>{t("stay.perNight")}</small></span>
          <span className="rating">★ {stay.rating.toFixed(1)}</span>
        </div>
      </div>
    </Link>
  );
}
