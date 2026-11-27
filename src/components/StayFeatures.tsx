import { getTranslations } from "next-intl/server";
import { Money } from "./Currency";

export interface StayInfo {
  location?: { name: string; value: string }[];
  locationNote?: string;
  rooms?: { name: string; value: string }[];
  roomsNote?: string;
  free?: string[];
  paid?: { name: string; price: number | null; text: string }[];
}

/* Simple line icons (24×24, stroke = currentColor), picked by keywords in the service name. */
const ICONS: [RegExp, string][] = [
  [/wi-?fi|интернет/i, "M2 8.5a15 15 0 0 1 20 0M5 12a10 10 0 0 1 14 0M8.5 15.5a5 5 0 0 1 7 0M12 19h.01"],
  [/бассейн/i, "M2 18c2 1.3 4 1.3 6 0s4-1.3 6 0 4 1.3 6 0M2 14c2 1.3 4 1.3 6 0s4-1.3 6 0 4 1.3 6 0M8 12V5a2 2 0 0 1 4 0M16 12V5a2 2 0 0 0-4 0M8 8h8"],
  [/пляж|шезлонг|зонт/i, "M12 3a9 9 0 0 1 9 9H3a9 9 0 0 1 9-9zM12 12v8M8 21h8"],
  [/парков|авто/i, "M5 17h14M6 17v2M18 17v2M4 13l2-6h12l2 6v4H4zM7.5 14h.01M16.5 14h.01"],
  [/детск/i, "M12 4a2 2 0 1 0 0 .01M8 21l2-7M16 21l-2-7M7 10l5 2 5-2M12 12v2"],
  [/бель|полотен|постел/i, "M3 7h18v10H3zM3 11h18M7 7v10"],
  [/фен|сушилк/i, "M4 9a5 5 0 0 1 10 0v1a5 5 0 0 1-10 0zM14 8h6M14 11h6M8 15l-1 6"],
  [/утюг|глаж/i, "M3 17h18l-2-7a4 4 0 0 0-4-3H8M3 17l2-5h6"],
  [/посуд|кухн|пищ|микроволн|чайник/i, "M4 11h16a8 8 0 0 1-16 0zM9 7c0-1 1-1 1-2M14 7c0-1 1-1 1-2"],
  [/мангал|шашлык|барбек|дров/i, "M5 10h14l-2 6H7zM9 16l-2 5M15 16l2 5M9 7c0-1.5 1.5-1.5 1.5-3M14 7c0-1.5 1.5-1.5 1.5-3"],
  [/обмен|валют|банкомат/i, "M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM15 9h-4a2 2 0 0 0 0 4h2a2 2 0 0 1 0 4H9M12 6v2M12 17v1"],
  [/туалет|принадлеж/i, "M7 3h10v4H7zM6 7h12v14H6zM10 11h4"],
  [/встреч|трансфер/i, "M3 16h18M5 16V9l3-4h8l3 4v7M7 19h.01M17 19h.01M5 9h14"],
  [/теннис|футбол|волейбол|баскет|бадминтон|тренаж|спорт|корт/i, "M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM3.5 9h17M3.5 15h17M12 3c-3 4-3 14 0 18M12 3c3 4 3 14 0 18"],
  [/саун|бан/i, "M4 20h16M6 20V9l6-5 6 5v11M10 20v-5h4v5M9 4c0-1 1-1 1-2"],
  [/пирс|дискотек|аттракцион|катер|дайвинг|рыбал/i, "M2 18c2 1.3 4 1.3 6 0s4-1.3 6 0 4 1.3 6 0M4 14h16M7 14V8M17 14V8M4 8h16"],
];
const CHECK = "M20 6 9 17l-5-5";

function Icon({ name }: { name: string }) {
  const d = ICONS.find(([re]) => re.test(name))?.[1] ?? CHECK;
  return (
    <svg className="feat-ico" viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={d} />
    </svg>
  );
}

/** "Features and services" block on the stay page (migrated from the old site's additional info). */
export async function StayFeatures({ info }: { info: StayInfo }) {
  const t = await getTranslations("stay");
  const free = info.free ?? [];
  const paid = info.paid ?? [];
  const loc = info.location ?? [];
  const rooms = info.rooms ?? [];
  if (!free.length && !paid.length && !loc.length && !rooms.length) return null;
  return (
    <div className="features">
      <h2 style={{ fontSize: 22, margin: 0 }}>{t("featuresTitle")}</h2>
      {free.length > 0 && (
        <div>
          <h3>{t("freeTitle")}</h3>
          <ul className="feat-grid">
            {free.map((f) => <li key={f}><Icon name={f} /><span>{f}</span></li>)}
          </ul>
        </div>
      )}
      {paid.length > 0 && (
        <div>
          <h3>{t("paidTitle")}</h3>
          <ul className="feat-rows">
            {paid.map((p) => (
              <li key={p.name}><span className="feat-name"><Icon name={p.name} />{p.name}</span><b>{p.price ? <Money som={p.price} /> : p.text}</b></li>
            ))}
          </ul>
        </div>
      )}
      {loc.length > 0 && (
        <div>
          <h3>{t("locationTitle")}</h3>
          {info.locationNote && <p className="note">{info.locationNote}</p>}
          <ul className="feat-rows">
            {loc.map((l) => <li key={l.name}><span>{l.name}</span><b>{l.value}</b></li>)}
          </ul>
        </div>
      )}
      {rooms.length > 0 && (
        <div>
          <h3>{t("roomStockTitle")}</h3>
          {info.roomsNote && <p className="note">{info.roomsNote}</p>}
          <ul className="feat-rows">
            {rooms.map((r) => <li key={r.name}><span>{r.name}</span><b>{r.value}</b></li>)}
          </ul>
        </div>
      )}
    </div>
  );
}
