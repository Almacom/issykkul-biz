-- Keep the sign-in email on the profile so the admin sees who claims a listing.
alter table public.profiles add column if not exists email text;

create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, full_name, email, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    lower(new.email),
    case when exists (select 1 from public.admin_emails a where a.email = lower(new.email)) then 'admin' else 'owner' end
  );
  return new;
end $$;

update public.profiles p set email = lower(u.email) from auth.users u where p.id = u.id and p.email is null;

-- claims are shown to the admin together with the listing and the claimant
create index if not exists claims_status_idx on public.claims (status);
