import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import type { Locale } from "@/i18n/routing";
import { getDrivers, placeName } from "@/lib/data";
import { TransferPicker } from "@/components/TransferPicker";

export async function generateMetadata({ params }: { params: Promise<{ locale: Locale }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "transfers" });
  return { title: t("title"), description: t("lead") };
}

export default async function TransfersPage({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations();
  const drivers = await getDrivers();
  const places: Record<string, string> = {};
  drivers.forEach((d) => d.routes.forEach((r) => { places[r.from] = placeName(r.from, locale); places[r.to] = placeName(r.to, locale); }));

  return (
    <section className="block">
      <div className="wrap">
        <div className="sec-head"><div><h1 style={{ fontSize: "clamp(22px,3vw,34px)" }}>{t("transfers.title")}</h1><p>{t("transfers.lead")}</p></div></div>
        <TransferPicker drivers={drivers} places={places} labels={{
          from: t("transfers.from"), to: t("transfers.to"), seats: t.raw("transfers.seats"), years: t.raw("transfers.years"),
          perCar: t("transfers.perCar"), empty: t("transfers.empty"), som: t("som"),
          whatsapp: t("stay.whatsapp"), telegram: t("stay.telegram"), showPhone: t("stay.showPhone"),
        }} />
      </div>
    </section>
  );
}
