-- Emails that become admins automatically on first sign-in.
-- info@issykkul.biz is also the contact for listings whose hosts have no email of their own.
create table if not exists public.admin_emails (email text primary key);
alter table public.admin_emails enable row level security;
create policy "admins read admin_emails" on public.admin_emails for select using (public.is_admin());

insert into public.admin_emails (email) values ('info@issykkul.biz') on conflict do nothing;

create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, full_name, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    case when exists (select 1 from public.admin_emails a where a.email = lower(new.email)) then 'admin' else 'owner' end
  );
  return new;
end $$;

-- SQL run by the project owner (no auth.uid()) may change roles; signed-in non-admins still cannot.
create or replace function public.protect_profile_role() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if auth.uid() is not null and not public.is_admin() then new.role := old.role; end if;
  return new;
end $$;

-- users who already signed in before this migration
update public.profiles p set role = 'admin'
from auth.users u, public.admin_emails a
where p.id = u.id and lower(u.email) = a.email and p.role <> 'admin';
