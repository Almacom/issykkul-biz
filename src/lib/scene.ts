/**
 * Deterministic lake-and-mountains illustration used as a placeholder
 * until hosts upload real photos. Same seed → same picture on server and client.
 */
const MOODS = [
  { sky: ["#7CC6E8", "#D6F0F7"], sun: "#FFF6D8", far: "#7FA6B8", near: "#3E6475", lake: ["#1FA3A6", "#0B5E6E"], shore: "#C9B07A" },
  { sky: ["#F2A65A", "#FCE3B6"], sun: "#FFF1C9", far: "#B07A86", near: "#5A3E55", lake: ["#E08E5B", "#3B4C6B"], shore: "#8A6A4A" },
  { sky: ["#9FB8D6", "#E9EEF5"], sun: "#FFFFFF", far: "#8FA0B8", near: "#46576E", lake: ["#5C9FB8", "#1F4C66"], shore: "#9AA68A" },
  { sky: ["#5DA9D6", "#BEE3F0"], sun: "#FFFBEA", far: "#6E95A8", near: "#2F5560", lake: ["#169C9A", "#0A4F5E"], shore: "#7FA35A" },
];

function rnd(seed: number) {
  let s = seed * 9301 + 49297;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

export function sceneSvg(seed: number, mood: number, opts: { yurt?: boolean; horizon?: number } = {}): string {
  const m = MOODS[mood % 4];
  const R = rnd(seed);
  const W = 600, H = 400, hz = opts.horizon ?? 232;
  const id = `sc${seed}m${mood}h${hz}`;

  const ridge = (base: number, amp: number, n: number, cap: boolean) => {
    const pts: [number, number][] = [[0, H]];
    const peaks: [number, number][] = [];
    for (let i = 0; i <= n; i++) {
      const x = (i * W) / n + (R() - 0.5) * 20, y = base - R() * amp;
      pts.push([x, y]);
      if (i % 2 === 1) peaks.push([x, y]);
    }
    pts.push([W, H]);
    const d = "M" + pts.map((p) => `${p[0].toFixed(0)} ${p[1].toFixed(0)}`).join(" L") + " Z";
    let caps = "";
    if (cap)
      for (const [x, y] of peaks)
        if (y < base - amp * 0.45)
          caps += `<path d="M${(x - 22).toFixed(0)} ${(y + 24).toFixed(0)} L${x.toFixed(0)} ${y.toFixed(0)} L${(x + 22).toFixed(0)} ${(y + 24).toFixed(0)} L${(x + 9).toFixed(0)} ${(y + 18).toFixed(0)} L${x.toFixed(0)} ${(y + 26).toFixed(0)} L${(x - 9).toFixed(0)} ${(y + 17).toFixed(0)} Z" fill="#fff" opacity=".95"/>`;
    return { d, caps };
  };

  const far = ridge(hz - 30, 110, 9, true);
  const near = ridge(hz - 4, 60, 7, false);
  const sx = 120 + R() * 360, sy = 60 + R() * 60;

  let waves = "";
  for (let i = 0; i < 7; i++) {
    const y = hz + 14 + i * 20 + R() * 6;
    waves += `<path d="M${(R() * 200).toFixed(0)} ${y.toFixed(0)} h${(120 + R() * 220).toFixed(0)}" stroke="#fff" stroke-opacity="${(0.12 + R() * 0.15).toFixed(2)}" stroke-width="2" stroke-linecap="round"/>`;
  }

  let yurts = "";
  if (opts.yurt)
    for (let i = 0; i < 3; i++) {
      const x = 330 + i * 70, y = H - 58;
      yurts += `<path d="M${x} ${y} q30 -34 60 0 v28 h-60 z" fill="#F4EFE4"/><path d="M${x} ${y} q30 -34 60 0" fill="none" stroke="#B5462F" stroke-width="4"/><rect x="${x + 24}" y="${y + 10}" width="12" height="18" fill="#7A4A2A"/>`;
    }

  return `<svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><defs>
<linearGradient id="${id}a" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${m.sky[0]}"/><stop offset="1" stop-color="${m.sky[1]}"/></linearGradient>
<linearGradient id="${id}b" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${m.lake[0]}"/><stop offset="1" stop-color="${m.lake[1]}"/></linearGradient></defs>
<rect width="${W}" height="${H}" fill="url(#${id}a)"/><circle cx="${sx.toFixed(0)}" cy="${sy.toFixed(0)}" r="26" fill="${m.sun}" opacity=".9"/>
<path d="${far.d}" fill="${m.far}"/>${far.caps}<path d="${near.d}" fill="${m.near}"/>
<rect y="${hz}" width="${W}" height="${H - hz}" fill="url(#${id}b)"/>${waves}
<path d="M0 ${H - 40} Q${W * 0.3} ${H - 62} ${W * 0.6} ${H - 44} T${W} ${H - 50} V${H} H0Z" fill="${m.shore}"/>${yurts}</svg>`;
}
