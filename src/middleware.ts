import { NextResponse, type NextRequest } from "next/server";
import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";
import REDIRECTS from "./lib/redirects.json";

const intl = createMiddleware(routing);
const MAP = REDIRECTS as Record<string, string | null>;
const CANONICAL_HOST = "www.issykkul.biz";
const IMAGE_BASE = process.env.NEXT_PUBLIC_IMAGE_BASE;

const GONE_HTML = `<!doctype html><html lang="ru"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>Страница удалена · Issykkul.Biz</title>
<body style="font-family:system-ui,sans-serif;max-width:560px;margin:15vh auto;padding:0 16px;color:#0D2A31"><h1>Страница удалена</h1>
<p>Этой страницы больше нет на сайте.</p><p><a href="/" style="color:#0E8A8C">Перейти на главную Issykkul.Biz</a></p></body></html>`;

function permanent(req: NextRequest, to: string) {
  const url = req.nextUrl.clone();
  const [p, q] = to.split("?");
  url.pathname = p;
  url.search = q ? `?${q}` : "";
  return NextResponse.redirect(url, 301);
}

/** Old DotNetNuke URLs (.aspx, ?revpage=…) → new pages; removed pages → 410. */
function legacy(req: NextRequest): NextResponse | null {
  const { pathname, search } = req.nextUrl;
  const lower = pathname.toLowerCase();

  // old photo URLs → photo storage (only once photos live elsewhere, to avoid a loop)
  if (lower.startsWith("/portals/") && IMAGE_BASE && !IMAGE_BASE.includes(CANONICAL_HOST)) {
    let key = lower;
    try { key = encodeURI(decodeURIComponent(pathname).toLowerCase()); } catch {}
    return NextResponse.redirect(IMAGE_BASE + key, 301);
  }
  if (!lower.endsWith(".aspx") && !lower.includes(".aspx/") && !MAP[lower]) return null;

  let q = search.toLowerCase();
  try { q = decodeURIComponent(q); } catch {}
  const withQuery = lower + q;
  const key = withQuery in MAP ? withQuery : lower in MAP ? lower : null;
  if (key === null) {
    // unknown old page: send to the home page rather than a dead end
    return lower.includes(".aspx") ? permanent(req, "/") : null;
  }
  const target = MAP[key];
  if (target === null) return new NextResponse(GONE_HTML, { status: 410, headers: { "content-type": "text/html; charset=utf-8" } });
  return permanent(req, target);
}

export default function middleware(req: NextRequest) {
  const host = req.headers.get("host") ?? "";
  if (host === "issykkul.biz") {
    const url = req.nextUrl.clone();
    url.host = CANONICAL_HOST;
    url.port = "";
    url.protocol = "https:";
    return NextResponse.redirect(url, 301);
  }
  const res = legacy(req) ?? intl(req);
  // test addresses (*.workers.dev, localhost) must never be indexed: they duplicate the real site
  if (host !== CANONICAL_HOST) res.headers.set("X-Robots-Tag", "noindex, nofollow");
  return res;
}

export const config = {
  // all pages, plus old .aspx and /Portals/ URLs (they contain a dot, so the first rule skips them)
  matcher: ["/((?!api|_next|_vercel|.*\\..*).*)", "/(.*\\.aspx.*)", "/(Portals|portals)/(.*)"],
};
