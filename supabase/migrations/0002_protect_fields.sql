-- Owners may edit their listing's content and contacts, but not plan, ownership or publication.
create function public.protect_listing_fields() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if public.is_admin() then return new; end if;
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
create trigger protect_listing_fields before update on public.listings
  for each row execute function public.protect_listing_fields();

-- simpler owner update policy now that the trigger guards the fields
drop policy "owner edits own" on public.listings;
create policy "owner edits own" on public.listings for update using (owner_id = auth.uid()) with check (owner_id = auth.uid());

-- users cannot promote themselves to admin
create function public.protect_profile_role() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if not public.is_admin() then new.role := old.role; end if;
  return new;
end $$;
create trigger protect_profile_role before update on public.profiles
  for each row execute function public.protect_profile_role();
drop policy "update own profile" on public.profiles;
create policy "update own profile" on public.profiles for update using (id = auth.uid()) with check (id = auth.uid());
