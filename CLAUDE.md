# Issykkul.Biz

Catalog of stays and transfers around Lake Issyk-Kul (Kyrgyzstan). Rebuild of a 16-year-old DotNetNuke site.
Owner works with Claude Code; explain changes in Russian.

## Business model
- Tourists contact hosts and drivers **directly** (WhatsApp / Telegram / phone). No booking, no commission.
- Revenue = subscriptions for hosts/drivers: Start (free), Standard 600/mo or 6 000/yr, Premium 1 200/mo or 12 000/yr, Driver 400/mo or 3 500/yr (som). Prices live in `PLAN_PRICES` in `src/lib/data.ts`.
- Start plan hides direct contacts (`showsDirectContacts`). Premium sorts first and gets the badge.
- Payments at launch are manual (MBank / Elsom / O!Dengi QR) — admin activates the subscription.

## Stack
- Next.js 15 App Router, TypeScript, plain CSS (`src/app/globals.css`, tokens on `:root`, light + dark).
- i18n: next-intl. Locales `ru` (default, no URL prefix), `en`, `ky` (shown as "KG"). Texts in `src/messages/*.json` — every UI string goes into all three files.
- Content migrated from the old site: JSON in `public/content/` (stays, articles, reviews, villages), read via `src/lib/content.ts` (ASSETS binding on Cloudflare, disk during build). Regenerate with `scripts/migrate/build_content.py <crawl_dir> .` — never edit the JSON by hand. `src/lib/data.ts` now only holds plan prices and demo transfer drivers. Planned DB: Supabase, draft in `supabase/schema.sql`.
- Text pages (guide, blog, stories, category landings, FAQ, terms) are served by one catch-all route `src/app/[locale]/[...path]/page.tsx`; category landing filters live in `src/lib/landings.ts`.
- SEO migration: `migration/url-map.json` (old URL → new). `scripts/migrate/build_redirects.py` turns it into `src/lib/redirects.json`, applied in `src/middleware.ts` (301 / 410). Canonical host `www.issykkul.biz`; other hosts get `X-Robots-Tag: noindex`. Migrated content is Russian only: EN/KY versions are noindex with canonical to RU.
- Photos are in R2 bucket `issykkul-photos`, served from https://img.issykkul.biz (`NEXT_PUBLIC_IMAGE_BASE`); keys are lower-cased decoded paths (`migration/images.txt`). Old `/Portals/...` URLs 301 to it.
- Hosting: Cloudflare Workers via OpenNext (`@opennextjs/cloudflare`, config in `wrangler.jsonc`, `open-next.config.ts`). Worker name `issykkul-biz`. Free plan limit 3 MB gzipped (currently ~1 MB) — check with `npx wrangler deploy --dry-run` after adding big dependencies. Domain registered at Namecheap, DNS already on Cloudflare (Free plan).
- Photos: `Scene` component draws placeholder landscapes until real photos exist.

## Commands
- `npm run dev` — local dev on :3000
- `npm run build` — Cloudflare build via OpenNext (calls `next build` inside); must pass before committing. Cloudflare Workers Builds runs `npm run build` then `npx wrangler deploy`
- `npm run build:next` — plain Next.js build
- `npm run lint`
- `npm run preview` — build for Cloudflare and run locally in the Workers runtime
- `npm run deploy` — build and deploy to Cloudflare (normally done automatically from GitHub)

## Launch target: 10 January 2027
Remaining: Supabase + owner auth & dashboard, admin panel, request form for Start plan, translations of migrated content, switch DNS (domain is already on Cloudflare; Pro plan cancelled).
