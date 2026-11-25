import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";

export async function Footer() {
  const t = await getTranslations("footer");
  return (
    <footer>
      <div className="wrap">
        <span>{t("about")}</span>
        <Link href="/pricing">{t("owners")}</Link>
      </div>
    </footer>
  );
}
