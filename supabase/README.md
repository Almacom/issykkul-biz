# Supabase

Project ref: `khsashrpjnbiywhshlan` (region eu-west-1).

- `migrations/` — SQL applied in order (via the Management API: `POST /v1/projects/{ref}/database/query`).
- `seed_listings.sql` — the 160 stays migrated from the old site (plan `standard`, agency WhatsApp).
- Auth: email magic link. Allowed redirect URLs: www.issykkul.biz, issykkul-biz.aspnetall.workers.dev, localhost.
- Email: custom SMTP via Google Workspace (smtp.gmail.com:465, sender admin@issykkul.biz), Russian templates, 100 emails/hour. Sign-in = magic link + 8-digit code.
- Admins: emails in `public.admin_emails` (now info@issykkul.biz) get the admin role on first sign-in. info@ is also the contact for listings whose hosts have no email.
- Pages: `/login`, `/cabinet` (owner: my listings, edit, claim an existing listing, add new), `/admin` (approve claims, publish new listings, record a paid subscription).
- Owner edits (`listings`: contacts, `data.description`, `data.priceFrom`, `data.type`, `data.village`) are merged into the public pages at build time (`src/lib/listings.ts`); contacts also refresh live.

- `reviews` (0006): reviews written on the new site; pending → published by the admin.
