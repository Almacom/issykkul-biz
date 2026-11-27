"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";

export type PhotoGroup = { title: string; urls: string[] };

/**
 * Wraps the top photo grid of a stay: clicking a photo or "All photos" opens a full-screen
 * viewer with every photo grouped by album (grounds, beach, cafe…) and by room.
 */
export function GalleryViewer({ groups, name, children }: { groups: PhotoGroup[]; name: string; children: React.ReactNode }) {
  const t = useTranslations("stay");
  const all = useMemo(() => groups.flatMap((g) => g.urls), [groups]);
  const [open, setOpen] = useState(false);
  const [cur, setCur] = useState<number | null>(null);

  const close = useCallback(() => {
    if (cur !== null) setCur(null);
    else setOpen(false);
  }, [cur]);
  const step = useCallback((d: number) => setCur((c) => (c === null ? c : (c + d + all.length) % all.length)), [all.length]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
      if (e.key === "ArrowRight") step(1);
      if (e.key === "ArrowLeft") step(-1);
    };
    document.addEventListener("keydown", onKey);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = overflow;
    };
  }, [open, close, step]);

  if (all.length === 0) return <>{children}</>;

  const onGridClick = (e: React.MouseEvent) => {
    const tile = (e.target as HTMLElement).closest("[data-i]");
    if (!tile) return;
    setOpen(true);
    setCur(Number(tile.getAttribute("data-i")));
  };

  let offset = 0;
  return (
    <div className="gv">
      <div className="gv-grid" onClick={onGridClick}>{children}</div>
      <button type="button" className="btn sm gv-all" onClick={() => { setOpen(true); setCur(null); }}>
        {t("allPhotos", { n: all.length })}
      </button>

      {open && (
        <div className="gv-modal" role="dialog" aria-modal="true" aria-label={name}>
          <div className="gv-bar">
            <b>{name}</b>
            <button type="button" className="btn sm ghost" onClick={() => setOpen(false)}>{t("close")} ✕</button>
          </div>
          <div className="gv-body">
            {groups.map((g, gi) => {
              const start = offset;
              offset += g.urls.length;
              return (
                <section key={gi} className="gv-group">
                  <h3>{g.title || t("photosTitle")} <span className="muted">· {g.urls.length}</span></h3>
                  <div className="gv-thumbs">
                    {g.urls.map((u, i) => (
                      <button type="button" key={u + i} onClick={() => setCur(start + i)} aria-label={`${g.title} ${i + 1}`}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={u} alt="" loading="lazy" decoding="async" />
                      </button>
                    ))}
                  </div>
                </section>
              );
            })}
          </div>

          {cur !== null && (
            <div className="gv-full" onClick={(e) => { if (e.target === e.currentTarget) setCur(null); }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={all[cur]} alt={`${name} — ${cur + 1}`} />
              <button type="button" className="gv-nav prev" onClick={() => step(-1)} aria-label={t("prev")}>‹</button>
              <button type="button" className="gv-nav next" onClick={() => step(1)} aria-label={t("next")}>›</button>
              <button type="button" className="gv-x" onClick={() => setCur(null)} aria-label={t("close")}>✕</button>
              <div className="gv-count">{cur + 1} / {all.length}</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
