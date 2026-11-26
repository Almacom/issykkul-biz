/**
 * Transfers (demo drivers until real drivers sign up) and subscription plans.
 * Stays and articles migrated from the old site live in src/lib/content.ts.
 */
import type { Locale } from "@/i18n/routing";

export type L10n = Record<Locale, string>;

export type Shore = "n" | "s" | "e" | "w";
export type Plan = "start" | "standard" | "premium" | "driver";

export interface Village {
  slug: string;
  name: L10n;
  /** position on the lake map, viewBox 0 0 1000 400 */
  x: number;
  y: number;
  shore: Shore;
  kmFromBishkek: number;
  mood: number;
}


export interface Driver {
  id: number;
  name: string;
  car: string;
  seats: number;
  years: number;
  rating: number;
  phone: string;
  whatsapp: string;
  routes: { from: string; to: string; price: number }[];
}

export const PLACES: Record<string, L10n> = {
  manas: { ru: "Аэропорт Манас", en: "Manas Airport", ky: "Манас аэропорту" },
  bishkek: { ru: "Бишкек", en: "Bishkek", ky: "Бишкек" },
};

export const VILLAGES: Village[] = [
  { slug: "balykchy", name: { ru: "Балыкчы", en: "Balykchy", ky: "Балыкчы" }, x: 70, y: 215, shore: "w", kmFromBishkek: 180, mood: 3 },
  { slug: "tamchy", name: { ru: "Тамчы", en: "Tamchy", ky: "Тамчы" }, x: 215, y: 118, shore: "n", kmFromBishkek: 220, mood: 0 },
  { slug: "cholpon-ata", name: { ru: "Чолпон-Ата", en: "Cholpon-Ata", ky: "Чолпон-Ата" }, x: 400, y: 88, shore: "n", kmFromBishkek: 255, mood: 1 },
  { slug: "bosteri", name: { ru: "Бостери", en: "Bosteri", ky: "Бостери" }, x: 465, y: 92, shore: "n", kmFromBishkek: 265, mood: 0 },
  { slug: "ananyevo", name: { ru: "Ананьево", en: "Ananyevo", ky: "Ананьево" }, x: 610, y: 110, shore: "n", kmFromBishkek: 320, mood: 2 },
  { slug: "karakol", name: { ru: "Каракол", en: "Karakol", ky: "Каракол" }, x: 930, y: 205, shore: "e", kmFromBishkek: 400, mood: 2 },
  { slug: "tamga", name: { ru: "Тамга", en: "Tamga", ky: "Тамга" }, x: 520, y: 320, shore: "s", kmFromBishkek: 330, mood: 3 },
  { slug: "bokonbaevo", name: { ru: "Боконбаево", en: "Bokonbaevo", ky: "Бөкөнбаев" }, x: 330, y: 322, shore: "s", kmFromBishkek: 290, mood: 1 },
];

const DEMO_PHONE = "+996555000000";


const DRIVERS: Driver[] = [
  { id: 1, name: "Азамат К.", car: "Toyota Alphard", seats: 6, years: 12, rating: 4.9, phone: DEMO_PHONE, whatsapp: DEMO_PHONE,
    routes: [{ from: "manas", to: "cholpon-ata", price: 7000 }, { from: "bishkek", to: "cholpon-ata", price: 6000 }, { from: "bishkek", to: "karakol", price: 11000 }, { from: "manas", to: "bosteri", price: 7300 }] },
  { id: 2, name: "Бакыт Т.", car: "Hyundai Starex", seats: 8, years: 9, rating: 4.8, phone: DEMO_PHONE, whatsapp: DEMO_PHONE,
    routes: [{ from: "manas", to: "cholpon-ata", price: 6500 }, { from: "bishkek", to: "cholpon-ata", price: 5500 }, { from: "bishkek", to: "bokonbaevo", price: 6500 }, { from: "cholpon-ata", to: "karakol", price: 5000 }] },
  { id: 3, name: "Нурлан А.", car: "Toyota Camry", seats: 3, years: 15, rating: 4.7, phone: DEMO_PHONE, whatsapp: DEMO_PHONE,
    routes: [{ from: "bishkek", to: "cholpon-ata", price: 4500 }, { from: "bishkek", to: "karakol", price: 8500 }, { from: "manas", to: "bosteri", price: 5800 }] },
  { id: 4, name: "Эрмек С.", car: "Mercedes Sprinter", seats: 18, years: 7, rating: 4.8, phone: DEMO_PHONE, whatsapp: DEMO_PHONE,
    routes: [{ from: "manas", to: "cholpon-ata", price: 12000 }, { from: "bishkek", to: "karakol", price: 16000 }, { from: "bishkek", to: "bokonbaevo", price: 11000 }, { from: "cholpon-ata", to: "karakol", price: 9000 }] },
];

/** Subscription prices in som. Yearly is roughly 2 months free plus a seasonal discount. */
export const PLAN_PRICES: Record<Plan, { month: number; year: number }> = {
  start: { month: 0, year: 0 },
  standard: { month: 600, year: 6000 },
  premium: { month: 1200, year: 12000 },
  driver: { month: 400, year: 3500 },
};



export async function getDrivers(): Promise<Driver[]> {
  return DRIVERS;
}

export function getVillage(slug: string): Village {
  return VILLAGES.find((v) => v.slug === slug) ?? VILLAGES[0];
}

export function placeName(slug: string, locale: Locale): string {
  return (PLACES[slug] ?? getVillage(slug).name)[locale];
}



export const formatSom = (n: number) => n.toLocaleString("ru-RU").replace(/ /g, " ");
