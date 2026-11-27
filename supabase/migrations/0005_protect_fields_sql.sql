-- Let SQL run by the project owner (no signed-in user, e.g. the dashboard or the Management API) and
-- foreign-key actions (owner deleted -> owner_id set null) change protected listing fields.
-- Signed-in non-admins are still limited to content and contacts.
create or replace function public.protect_listing_fields() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if auth.uid() is null or public.is_admin() then return new; end if;
  new.plan := old.plan;
  new.plan_until := old.plan_until;
  new.owner_id := old.owner_id;
  new.slug := old.slug;
  new.kind := old.kind;
  new.legacy_id := old.legacy_id;
  if new.status = 'published' and old.status <> 'published' then new.status := 'pending'; end if;
  new.updated_at := now();
  return new;
end $$;

update public.listings set owner_id = null where owner_id is not null and owner_id not in (select id from public.profiles);
