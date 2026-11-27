import { getTranslations } from "next-intl/server";
import { img } from "@/lib/content";
import { GalleryViewer, type PhotoGroup } from "./GalleryViewer";

/** Photo albums migrated from the old site's text pages (villages, excursions, beaches). */
export async function ArticleAlbums({ albums, name }: { albums: { title: string; photos: string[] }[]; name: string }) {
  const t = await getTranslations("stay");
  const groups: PhotoGroup[] = albums.map((a) => ({ title: a.title, urls: a.photos.map((p) => img(p)!) }));
  const first = groups.flatMap((g) => g.urls).slice(0, 8);
  if (!first.length) return null;
  return (
    <section className="art-albums">
      <h2>{t("photosTitle")}</h2>
      <GalleryViewer groups={groups} name={name}>
        <div className="gv-thumbs">
          {first.map((u, i) => (
            <button type="button" key={u} data-i={i} aria-label={`${name} ${i + 1}`}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={u} alt={`${name} — ${i + 1}`} loading="lazy" decoding="async" />
            </button>
          ))}
        </div>
      </GalleryViewer>
    </section>
  );
}
