import { Suspense } from "react";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { LangSwitch } from "./LangSwitch";
import { NavLinks } from "./NavLinks";
import { CurrencySwitch } from "./Currency";

export async function Header() {
  const t = await getTranslations("nav");
  const items = [
    { href: "/stays", label: t("stays") },
    { href: "/guide", label: t("guide") },
    { href: "/transfers", label: t("transfers") },
    { href: "/otzyvy", label: t("reviews") },
    { href: "/pricing", label: t("pricing") },
    { href: "/cabinet", label: t("cabinet") },
  ];
  return (
    <header className="top">
      <div className="wrap">
        <Link className="logo" href="/">
          <svg width="26" height="26" viewBox="0 0 26 26" aria-hidden="true">
            <path d="M2 17 L8 8 L11 12 L15 5 L24 17 Z" fill="var(--lake-deep)" />
            <path d="M13.3 7.6 L15 5 L16.8 7.8 L15.4 7.2 Z" fill="var(--snow)" />
            <ellipse cx="13" cy="20" rx="11" ry="3.2" fill="var(--lake)" />
          </svg>
          <span>Issykkul<b>.Biz</b></span>
        </Link>
        <NavLinks items={items} />
        <div className="top-tools">
          <CurrencySwitch />
          <Suspense fallback={<div className="langs" />}><LangSwitch /></Suspense>
        </div>
      </div>
    </header>
  );
}
