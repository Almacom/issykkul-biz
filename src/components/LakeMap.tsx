import { Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import { VILLAGES, formatSom, getVillage, type Stay } from "@/lib/data";

const LAKE = "M40 215 C60 160 140 120 230 108 C330 80 450 72 560 88 C690 104 820 130 905 175 C950 200 945 238 900 258 C800 300 660 330 520 335 C400 340 280 335 190 312 C110 292 45 260 40 215 Z";

/** Schematic map of Issyk-Kul with price pins. Swap for a real map (Leaflet/2GIS) later. */
export function LakeMap({ stays, locale, highlight }: { stays: Stay[]; locale: Locale; highlight?: number }) {
  return (
    <svg viewBox="0 0 1000 400" role="img" aria-label="Issyk-Kul map">
      <rect width="1000" height="400" fill="var(--bg)" />
      <path d="M0 40 L80 10 L160 34 L250 6 L340 30 L430 4 L520 28 L610 8 L700 30 L800 6 L900 26 L1000 10 V0 H0Z" fill="var(--line)" />
      <path d="M0 400 L90 372 L180 392 L280 366 L380 390 L480 362 L580 388 L680 364 L780 390 L880 368 L1000 392 V400Z" fill="var(--line)" />
      <path d={LAKE} fill="var(--lake-soft)" stroke="var(--lake)" strokeWidth="2" />
      <text x="500" y="215" textAnchor="middle" fontSize="22" letterSpacing="6" fill="var(--lake)" opacity=".7" fontFamily="Unbounded,sans-serif">ЫСЫК-КӨЛ</text>
      <text x="40" y="70" fontSize="13" fill="var(--muted)">Күңгөй Ала-Тоо</text>
      <text x="760" y="352" fontSize="13" fill="var(--muted)">Тескей Ала-Тоо</text>
      {VILLAGES.map((v) => (
        <text key={v.slug} x={v.x} y={v.y + (v.shore === "s" ? 34 : v.shore === "n" ? -34 : 30)} textAnchor="middle" fontSize="14" fill="var(--muted)">
          {v.name[locale]}
        </text>
      ))}
      {stays.map((s) => {
        const v = getVillage(s.village);
        const o = ((s.id % 3) - 1) * 14;
        return (
          <Link key={s.id} href={`/stays/${s.slug}`} aria-label={s.name}>
            <g transform={`translate(${v.x + o} ${v.y})`}>
              <circle r={highlight === s.id ? 13 : 10} fill={s.plan === "premium" ? "var(--sand)" : "var(--surface)"} stroke="var(--lake-deep)" strokeWidth="3" />
              <text y="-18" textAnchor="middle" fontSize="15" fontWeight="700" fill="var(--ink)">{formatSom(s.priceFrom)}</text>
            </g>
          </Link>
        );
      })}
    </svg>
  );
}
