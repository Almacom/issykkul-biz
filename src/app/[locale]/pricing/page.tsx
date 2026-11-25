import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import type { Locale } from "@/i18n/routing";
import { PricingPlans } from "@/components/PricingPlans";

export async function generateMetadata({ params }: { params: Promise<{ locale: Locale }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "pricing" });
  return { title: t("title"), description: t("lead") };
}

export default async function PricingPage({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("pricing");
  const faq = t.raw("q") as [string, string][];
  return (
    <section className="block">
      <div className="wrap">
        <PricingPlans />
        <div style={{ marginTop: 48 }}>
          <h2 style={{ fontSize: 24, marginBottom: 16 }}>{t("faq")}</h2>
          <div className="faq">
            {faq.map(([q, a]) => <details key={q}><summary>{q}</summary><p>{a}</p></details>)}
          </div>
        </div>
      </div>
    </section>
  );
}
