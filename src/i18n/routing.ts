import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales: ["ru", "en", "ky"],
  defaultLocale: "ru",
  // Russian lives at "/", others at "/en", "/ky" — keeps the old Russian URLs short for SEO.
  localePrefix: "as-needed",
  // Language is chosen with the RU/EN/KG switch, not guessed from browser settings.
  localeDetection: false,
});

export type Locale = (typeof routing.locales)[number];
