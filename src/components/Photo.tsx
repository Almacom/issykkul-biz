import { img } from "@/lib/content";
import { Scene } from "./Scene";

/** Real photo when available, otherwise the drawn placeholder. */
export function Photo({ src, alt, seed = 1, eager }: { src: string | null | undefined; alt: string; seed?: number; eager?: boolean }) {
  const url = img(src);
  if (!url) return <Scene seed={seed} mood={seed % 4} />;
  return (
    // Plain <img>: photos come from an external host (old server, later R2).
    // eslint-disable-next-line @next/next/no-img-element
    <img className="photo" src={url} alt={alt} loading={eager ? "eager" : "lazy"} decoding="async" />
  );
}
