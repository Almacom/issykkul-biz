# Supabase

Project ref: `khsashrpjnbiywhshlan` (region eu-west-1).

- `migrations/` — SQL applied in order (via the Management API: `POST /v1/projects/{ref}/database/query`).
- `seed_listings.sql` — the 160 stays migrated from the old site (plan `standard`, agency WhatsApp).
- Auth: email magic link. Allowed redirect URLs: www.issykkul.biz, issykkul-biz.aspnetall.workers.dev, localhost.
- TODO before launch: custom SMTP (the default sender allows 2 emails/hour and no custom templates).
- Make the owner an admin: `update public.profiles set role = 'admin' where id = (select id from auth.users where email = '...');`
