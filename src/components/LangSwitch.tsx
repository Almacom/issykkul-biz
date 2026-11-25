"use client";
import { useLocale } from "next-intl";
import { useSearchParams } from "next/navigation";
import { Link, usePathname } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";

const LABEL: Record<string, string> = { ru: "RU", en: "EN", ky: "KG" };

export function LangSwitch() {
  const locale = useLocale();
  const path = usePathname();
  const qs = useSearchParams().toString();
  const href = qs ? `${path}?${qs}` : path;
  return (
    <div className="langs" role="group" aria-label="Language">
      {routing.locales.map((l) => (
        <Link key={l} href={href} locale={l} className={l === locale ? "on" : undefined} hrefLang={l}>
          {LABEL[l]}
        </Link>
      ))}
    </div>
  );
}
