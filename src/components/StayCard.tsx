import { getLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import { villageName, type StaySummary, type Village } from "@/lib/content";
import { FromPrice } from "./Currency";
import { Photo } from "./Photo";

export async function StayCard({ stay, villages }: { stay: StaySummary; villages: Village[] }) {
  const t = await getTranslations();
  const locale = (await getLocale()) as Locale;
  return (
    <Link className="card" href={`/stays/${stay.slug}`}>
      <div className="ph">
        <Photo src={stay.photo} alt={stay.name} seed={stay.name.length} />
        {stay.plan === "premium" && <span className="badge">{t("stay.premium")}</span>}
      </div>
      <div className="body">
        <div className="meta">{t(`types.${stay.type}`)} · {villageName(villages, stay.village, locale)}</div>
        <h3>{stay.name}</h3>
        <div className="row">
          <span className="price">
            {stay.priceFrom ? <>{<FromPrice text={t("stay.from", { price: "@@P@@" })} som={stay.priceFrom!} />} <small>{t("stay.perNight")}</small></> : <small>{t("stay.priceOnRequest")}</small>}
          </span>
          {stay.reviewCount > 0 && stay.rating ? (
            <span className="rating">★ {stay.rating.toFixed(1)} · {t("stay.reviewsN", { n: stay.reviewCount })}</span>
          ) : null}
        </div>
      </div>
    </Link>
  );
}
