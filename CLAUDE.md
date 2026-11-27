# Issykkul.Biz

Catalog of stays and transfers around Lake Issyk-Kul (Kyrgyzstan). Rebuild of a 16-year-old DotNetNuke site.
Owner works with Claude Code; explain changes in Russian.

## Business model
- Tourists contact hosts and drivers **directly** (WhatsApp / Telegram / phone). No booking, no commission.
- Revenue = subscriptions for hosts/drivers: Start (free), Standard 600/mo or 6 000/yr, Premium 1 200/mo or 12 000/yr, Driver 500/mo or 5 000/yr (som). Prices live in `PLAN_PRICES` in `src/lib/data.ts`.
- Start plan hides direct contacts (`showsDirectContacts`). Premium sorts first and gets the badge.
- Payments at launch are manual (MBank / Elsom / O!Dengi QR) — admin activates the subscription.

## Stack
- Next.js 15 App Router, TypeScript, plain CSS (`src/app/globals.css`, tokens on `:root`). The site is always light / white background (owner's choice) — no automatic dark mode.
- i18n: next-intl. Locales `ru` (default, no URL prefix), `en`, `ky` (shown as "KG"). Texts in `src/messages/*.json` — every UI string goes into all three files.
- Content migrated from the old site: JSON in `public/content/` (stays, articles, reviews, villages), read via `src/lib/content.ts` (ASSETS binding on Cloudflare, disk during build). Regenerate with `scripts/migrate/build_content.py <crawl_dir> .` — never edit the JSON by hand. `src/lib/data.ts` now only holds plan prices and demo transfer drivers. DB: Supabase, migrations in `supabase/migrations/` (see `supabase/README.md`).
- Text pages (guide, blog, stories, category landings, FAQ, terms) are served by one catch-all route `src/app/[locale]/[...path]/page.tsx`; category landing filters live in `src/lib/landings.ts`.
- SEO migration: `migration/url-map.json` (old URL → new). `scripts/migrate/build_redirects.py` turns it into `src/lib/redirects.json`, applied in `src/middleware.ts` (301 / 410). Canonical host `www.issykkul.biz`; other hosts get `X-Robots-Tag: noindex`. Migrated content is Russian only: EN/KY versions are noindex with canonical to RU.
- Photos are in R2 bucket `issykkul-photos`, served from https://img.issykkul.biz (`NEXT_PUBLIC_IMAGE_BASE`); keys are lower-cased decoded paths (`migration/images.txt`). Old `/Portals/...` URLs 301 to it.
- Hosting: Cloudflare Workers via OpenNext (`@opennextjs/cloudflare`, config in `wrangler.jsonc`, `open-next.config.ts`). Worker name `issykkul-biz`. Free plan limit 3 MB gzipped (currently ~1 MB) — check with `npx wrangler deploy --dry-run` after adding big dependencies. Domain registered at Namecheap, DNS already on Cloudflare (Free plan).
- Currency: prices are stored in som; visitors switch сом / ₽ / $ / ₸ in the header (`src/components/Currency.tsx`). Rates = Mossovet "sell" column from akchabar.kg, fetched by `/api/rates` (edge-cached 6 h), fallback in `src/lib/currency.ts`. Host plan prices stay in som.
- Palette: white, black, grey and azure (lake), tokens on `:root` in globals.css.
- Accounts: Supabase email sign-in (`src/lib/supabase.ts`, publishable key); `/login`, `/cabinet`, `/admin` are client-rendered (`src/components/account/`). Contact clicks go to `contact_clicks` via `/api/track`. Card covers = old site's obj-thumbs (`migration/covers.json`, `scripts/migrate/collect_covers.py`). Stay page gallery: object albums (grounds, beach, cafe…) first, then rooms; full viewer in `src/components/GalleryViewer.tsx`.
- DB → public pages: `src/lib/listings.ts` reads published `listings` at build time (fresh every build, falls back to the JSON if Supabase is down); `getStayIndex` / `getStayBySlug` in `content.ts` merge owner edits (name, description, priceFrom, contacts), plans (expired → Start) and append listings added in the dashboard. Contacts on stay pages also refresh live in the browser (`ContactButtons live`). Start plan shows the agency WhatsApp instead of the host's. Anything other than contacts appears after the next deploy (push or retry in Cloudflare).
- Photos: `Scene` component draws placeholder landscapes until real photos exist.

## Commands
- `npm run dev` — local dev on :3000
- `npm run build` — Cloudflare build via OpenNext (calls `next build` inside); must pass before committing. Cloudflare Workers Builds runs `npm run build` then `npx wrangler deploy`
- `npm run build:next` — plain Next.js build
- `npm run lint`
- `npm run preview` — build for Cloudflare and run locally in the Workers runtime
- `npm run deploy` — build and deploy to Cloudflare (normally done automatically from GitHub)

## Launch target: 10 January 2027
Remaining: one-click site rebuild from the admin panel (needs a Cloudflare token with Workers Builds access), drivers from the DB on /transfers, owner photo upload, email notifications to info@ about new claims, request form for Start plan, translations of migrated content, switch DNS (domain is already on Cloudflare; Pro plan cancelled).
