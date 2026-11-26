import { Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import type { StaySummary, Village } from "@/lib/content";
import { LABELLED, VILLAGE_XY } from "@/lib/geo";

const LAKE = "M40 215 C60 160 140 120 230 108 C330 80 450 72 560 88 C690 104 820 130 905 175 C950 200 945 238 900 258 C800 300 660 330 520 335 C400 340 280 335 190 312 C110 292 45 260 40 215 Z";

/** Schematic map of Issyk-Kul: one pin per village with the number of places. */
export function LakeMap({ stays, villages, locale, highlight }: { stays: StaySummary[]; villages: Village[]; locale: Locale; highlight?: string | null }) {
  const counts = new Map<string, number>();
  for (const s of stays) if (s.village) counts.set(s.village, (counts.get(s.village) ?? 0) + 1);
  return (
    <svg viewBox="0 0 1000 400" role="img" aria-label="Issyk-Kul map">
      <rect width="1000" height="400" fill="var(--bg)" />
      <path d="M0 40 L80 10 L160 34 L250 6 L340 30 L430 4 L520 28 L610 8 L700 30 L800 6 L900 26 L1000 10 V0 H0Z" fill="var(--line)" />
      <path d="M0 400 L90 372 L180 392 L280 366 L380 390 L480 362 L580 388 L680 364 L780 390 L880 368 L1000 392 V400Z" fill="var(--line)" />
      <path d={LAKE} fill="var(--lake-soft)" stroke="var(--lake)" strokeWidth="2" />
      <text x="560" y="215" textAnchor="middle" fontSize="22" letterSpacing="6" fill="var(--lake)" opacity=".7" fontFamily="Unbounded,sans-serif">ЫСЫК-КӨЛ</text>
      {villages.map((v) => {
        const xy = VILLAGE_XY[v.slug];
        if (!xy) return null;
        const n = counts.get(v.slug) ?? 0;
        const on = highlight === v.slug;
        const north = v.shore === "n";
        const showLabel = on || LABELLED.has(v.slug) || n >= 3;
        const dot = (
          <g transform={`translate(${xy[0]} ${xy[1]})`}>
            <circle r={on ? 12 : n ? 7 + Math.min(n, 40) / 6 : 4} fill={on ? "var(--sand)" : n ? "var(--surface)" : "var(--line)"} stroke="var(--lake-deep)" strokeWidth={n || on ? 2.5 : 1} />
            {n > 0 && <text y="5" textAnchor="middle" fontSize="13" fontWeight="700" fill="var(--ink)">{n}</text>}
            {showLabel && <text y={north ? -16 - Math.min(n, 40) / 6 : 30} textAnchor="middle" fontSize="13" fill="var(--muted)">{v.name[locale]}</text>}
          </g>
        );
        return n ? <Link key={v.slug} href={{ pathname: "/stays", query: { village: v.slug } }} aria-label={v.name[locale]}>{dot}</Link> : <g key={v.slug}>{dot}</g>;
      })}
    </svg>
  );
}
