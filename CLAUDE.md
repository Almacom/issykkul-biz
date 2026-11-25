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
- Data: `src/lib/data.ts` is the only data access point (demo seed for now). Planned DB: Supabase, draft in `supabase/schema.sql`.
- Photos: `Scene` component draws placeholder landscapes until real photos exist.

## Commands
- `npm run dev` — local dev on :3000
- `npm run build` — must pass before committing
- `npm run lint`

## Launch target: 10 January 2027
Remaining: Supabase + owner auth & dashboard, admin panel, request form for Start plan, real photos, import of ~50 objects from DotNetNuke (SQL Server), 301 redirects from old URLs, Vercel deploy, DNS on Namecheap.
