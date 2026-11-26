import { withImageBase } from "@/lib/content";

/** Renders HTML migrated from the old site (our own content, cleaned at import). */
export function ArticleBody({ html }: { html: string }) {
  return <div className="prose" dangerouslySetInnerHTML={{ __html: withImageBase(html) }} />;
}
