import { getTranslations } from "next-intl/server";
import type { Review } from "@/lib/content";

export async function Reviews({ reviews, limit = 20 }: { reviews: Review[]; limit?: number }) {
  const t = await getTranslations("reviews");
  if (!reviews.length) return null;
  const card = (r: Review) => (
        <article key={r.id} className="review">
          <header>
            <div className="ava">{(r.author || "?")[0]}</div>
            <div>
              <b>{r.author}</b>{r.from ? <span className="note"> · {r.from}</span> : null}
              <div className="note">{r.date ? new Date(r.date).toLocaleDateString("ru-RU", { month: "long", year: "numeric" }) : ""}{r.with ? ` · ${r.with}` : ""}</div>
            </div>
            {r.rating > 0 && <span className="score">{r.rating.toFixed(1)}</span>}
          </header>
          {r.title && <h3>{r.title}</h3>}
          <p>{r.text}</p>
        </article>
  );
  // All reviews are in the HTML (good for search engines); the rest open with a native <details>, no JS needed.
  return (
    <div className="reviews">
      {reviews.slice(0, limit).map(card)}
      {reviews.length > limit && (
        <details className="more-reviews">
          <summary className="btn ghost">{t("more", { n: reviews.length - limit })}</summary>
          <div className="reviews">{reviews.slice(limit).map(card)}</div>
        </details>
      )}
    </div>
  );
}
