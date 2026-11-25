/**
 * Data layer.
 *
 * Until Supabase is connected, the site runs on the demo seed below.
 * Every page reads data only through the async functions at the bottom,
 * so switching to Supabase means changing those functions, not the pages.
 */
import type { Locale } from "@/i18n/routing";

export type L10n = Record<Locale, string>;

export type StayType = "hotel" | "guest" | "yurt" | "cottage" | "resort";
export type Amenity = "beach" | "pool" | "wifi" | "breakfast" | "parking" | "kids" | "sauna";
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

export interface Stay {
  id: number;
  slug: string;
  village: string;
  type: StayType;
  name: string;
  priceFrom: number;
  rating: number;
  plan: Plan;
  verified: boolean;
  amenities: Amenity[];
  listedSince: number;
  hostName: string;
  phone: string;
  whatsapp: string;
  telegram?: string;
  description: L10n;
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

const STAYS: Stay[] = [
  { id: 1, slug: "kok-jar-resort", village: "bosteri", type: "resort", name: "Kök-Jar Resort", priceFrom: 6500, rating: 4.9, plan: "premium", verified: true,
    amenities: ["beach", "pool", "wifi", "breakfast", "parking", "kids"], listedSince: 2011, hostName: "Айдай", phone: DEMO_PHONE, whatsapp: DEMO_PHONE, telegram: "demo", mood: 1,
    description: {
      ru: "Резорт на первой линии с собственным песчаным пляжем, открытым бассейном и видом на Кунгей Ала-Тоо. Номера и отдельные коттеджи.",
      en: "Beachfront resort with its own sandy beach, outdoor pool and views of the Kungey Ala-Too range. Rooms and private cottages.",
      ky: "Биринчи линиядагы курорт: өз кумдуу пляжы, ачык бассейн жана Күңгөй Ала-Тоого көрүнүш." } },
  { id: 2, slug: "aigerim-guest-house", village: "cholpon-ata", type: "guest", name: "Aigerim Guest House", priceFrom: 2500, rating: 4.8, plan: "standard", verified: true,
    amenities: ["wifi", "breakfast", "parking", "kids"], listedSince: 2014, hostName: "Айгерим", phone: DEMO_PHONE, whatsapp: DEMO_PHONE, mood: 0,
    description: {
      ru: "Семейный гостевой дом в 7 минутах от пляжа. Домашние завтраки, сад с яблонями, топчаны для вечернего чая.",
      en: "Family guesthouse 7 minutes from the beach. Home-made breakfast, apple orchard and topchans for evening tea.",
      ky: "Пляжга 7 мүнөттүк үй-бүлөлүк конок үй. Үй тамагы, алма бак жана кечки чай үчүн тапчандар." } },
  { id: 3, slug: "jailoo-yurt-camp", village: "bokonbaevo", type: "yurt", name: "Jailoo Yurt Camp", priceFrom: 1800, rating: 4.9, plan: "premium", verified: true,
    amenities: ["beach", "breakfast", "parking", "sauna"], listedSince: 2016, hostName: "Бакыт", phone: DEMO_PHONE, whatsapp: DEMO_PHONE, telegram: "demo", mood: 3,
    description: {
      ru: "Юрты на южном берегу у самой воды. Конные прогулки, беш-бармак на ужин, демонстрация охоты с беркутом.",
      en: "Yurts on the south shore right by the water. Horse rides, beshbarmak dinners and eagle-hunting demos.",
      ky: "Түштүк жээкте суунун жээгиндеги боз үйлөр. Ат менен сейил, кечки бешбармак, бүркүт менен мелдеш." } },
  { id: 4, slug: "tamchy-beach-house", village: "tamchy", type: "guest", name: "Tamchy Beach House", priceFrom: 3200, rating: 4.6, plan: "standard", verified: false,
    amenities: ["beach", "wifi", "parking", "kids"], listedSince: 2019, hostName: "Нурлан", phone: DEMO_PHONE, whatsapp: DEMO_PHONE, mood: 0,
    description: {
      ru: "Тихий дом у мелкого пляжа, рядом аэропорт Тамчы. Хорошо для семей с маленькими детьми.",
      en: "Quiet house by a shallow beach, close to Tamchy airport. Great for families with small kids.",
      ky: "Тайыз пляждын жанындагы тынч үй, Тамчы аэропорту жакын." } },
  { id: 5, slug: "karakol-mountain-inn", village: "karakol", type: "hotel", name: "Karakol Mountain Inn", priceFrom: 3000, rating: 4.7, plan: "standard", verified: true,
    amenities: ["wifi", "breakfast", "parking", "sauna"], listedSince: 2013, hostName: "Эрмек", phone: DEMO_PHONE, whatsapp: DEMO_PHONE, mood: 2,
    description: {
      ru: "Отель для треккеров: старт маршрутов на Ала-Куль и Алтын-Арашан, хранение снаряжения, ранние завтраки.",
      en: "A hotel for trekkers: trailheads to Ala-Kul and Altyn-Arashan, gear storage, early breakfasts.",
      ky: "Треккерлер үчүн мейманкана: Ала-Көл жана Алтын-Арашанга каттамдар." } },
  { id: 6, slug: "ak-suu-cottages", village: "ananyevo", type: "cottage", name: "Ak-Suu Cottages", priceFrom: 9000, rating: 5.0, plan: "premium", verified: true,
    amenities: ["beach", "wifi", "parking", "kids", "sauna"], listedSince: 2018, hostName: "Жылдыз", phone: DEMO_PHONE, whatsapp: DEMO_PHONE, mood: 2,
    description: {
      ru: "Четыре коттеджа на 6–8 гостей в сосновой роще. Своя баня, мангал, тихий пляж.",
      en: "Four cottages for 6–8 guests in a pine grove. Private banya, grill and a quiet beach.",
      ky: "Карагайлуу токойдогу 6–8 кишилик төрт коттедж. Өз мунчасы жана тынч пляж." } },
  { id: 7, slug: "salkyn-guest-house", village: "tamga", type: "guest", name: "Salkyn Guest House", priceFrom: 2000, rating: 4.7, plan: "start", verified: false,
    amenities: ["breakfast", "parking", "wifi"], listedSince: 2015, hostName: "Гулнара", phone: DEMO_PHONE, whatsapp: DEMO_PHONE, mood: 3,
    description: {
      ru: "Прохладное ущелье Тамги, 10 минут до озера. Хозяйка готовит лагман и борсоки.",
      en: "Cool Tamga gorge, 10 minutes to the lake. The host cooks lagman and boorsok.",
      ky: "Тамганын салкын капчыгайы, көлгө 10 мүнөт. Ээси лагман жана боорсок жасайт." } },
  { id: 8, slug: "shookum-hotel", village: "cholpon-ata", type: "hotel", name: "Shookum Hotel", priceFrom: 4800, rating: 4.5, plan: "premium", verified: true,
    amenities: ["pool", "wifi", "breakfast", "parking", "kids"], listedSince: 2012, hostName: "Азамат", phone: DEMO_PHONE, whatsapp: DEMO_PHONE, mood: 1,
    description: {
      ru: "Отель в центре Чолпон-Аты: бассейн с подогревом, 5 минут до пляжа и Рух Ордо.",
      en: "Central Cholpon-Ata hotel with a heated pool, 5 minutes to the beach and Rukh Ordo.",
      ky: "Чолпон-Атанын борборундагы мейманкана, жылытылган бассейн." } },
];

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

const planRank: Record<Plan, number> = { premium: 3, standard: 2, driver: 1, start: 0 };

/** Premium first, then by rating. */
const byPromotion = (a: Stay, b: Stay) => planRank[b.plan] - planRank[a.plan] || b.rating - a.rating;

export async function getStays(): Promise<Stay[]> {
  return [...STAYS].sort(byPromotion);
}

export async function getStay(slug: string): Promise<Stay | undefined> {
  return STAYS.find((s) => s.slug === slug);
}

export async function getDrivers(): Promise<Driver[]> {
  return DRIVERS;
}

export function getVillage(slug: string): Village {
  return VILLAGES.find((v) => v.slug === slug) ?? VILLAGES[0];
}

export function placeName(slug: string, locale: Locale): string {
  return (PLACES[slug] ?? getVillage(slug).name)[locale];
}

/** Direct contacts are shown only on paid plans; "start" listings get a site form. */
export function showsDirectContacts(stay: Stay): boolean {
  return stay.plan !== "start";
}

export function seasonPrices(price: number): [number, number, number] {
  const r = (n: number) => Math.round(n / 100) * 100;
  return [price, r(price * 1.35), r(price * 0.7)];
}

export const formatSom = (n: number) => n.toLocaleString("ru-RU").replace(/ /g, " ");
