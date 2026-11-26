-- Issykkul.Biz — initial schema.
-- Content (texts, rooms, photos) of migrated stays stays in public/content JSON for now;
-- the database holds ownership, contacts, plans, claims and statistics.

-- ---------- profiles ----------
create table public.profiles (
  id uuid primary key references auth.users on delete cascade,
  full_name text,
  phone text,
  whatsapp text,
  role text not null default 'owner' check (role in ('owner', 'driver', 'admin')),
  created_at timestamptz not null default now()
);

-- create a profile automatically for every new user
create function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, full_name) values (new.id, coalesce(new.raw_user_meta_data->>'full_name', ''));
  return new;
end $$;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

create function public.is_admin() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
$$;

-- ---------- listings (stays and drivers) ----------
create table public.listings (
  id bigint generated always as identity primary key,
  slug text unique not null,
  kind text not null default 'stay' check (kind in ('stay', 'driver')),
  owner_id uuid references public.profiles on delete set null,
  name text not null,
  status text not null default 'published' check (status in ('draft', 'pending', 'published', 'hidden')),
  plan text not null default 'start' check (plan in ('start', 'standard', 'premium', 'driver')),
  plan_until date,
  whatsapp text,
  telegram text,
  phone text,
  data jsonb not null default '{}',        -- owner edits (description, prices, ...) on top of migrated content
  legacy_id int,                           -- object id on the old DotNetNuke site
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index on public.listings (owner_id);

-- ---------- claims: an owner asks to take over a migrated listing ----------
create table public.claims (
  id bigint generated always as identity primary key,
  listing_id bigint not null references public.listings on delete cascade,
  user_id uuid not null references public.profiles on delete cascade,
  message text,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  created_at timestamptz not null default now(),
  unique (listing_id, user_id)
);

-- ---------- subscriptions (activated manually after MBank / Elsom / O!Dengi payment) ----------
create table public.subscriptions (
  id bigint generated always as identity primary key,
  listing_id bigint not null references public.listings on delete cascade,
  plan text not null check (plan in ('standard', 'premium', 'driver')),
  starts_at date not null default current_date,
  ends_at date not null,
  amount int not null default 0,
  note text,
  created_by uuid references public.profiles,
  created_at timestamptz not null default now()
);

-- keep listings.plan / plan_until in sync with the latest subscription
create function public.apply_subscription() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  update public.listings set plan = new.plan, plan_until = new.ends_at, updated_at = now() where id = new.listing_id;
  return new;
end $$;
create trigger on_subscription_added after insert on public.subscriptions
  for each row execute function public.apply_subscription();

-- ---------- contact clicks (statistics for hosts) ----------
create table public.contact_clicks (
  id bigint generated always as identity primary key,
  listing_slug text not null,
  channel text not null check (channel in ('whatsapp', 'telegram', 'phone')),
  created_at timestamptz not null default now()
);
create index on public.contact_clicks (listing_slug, created_at);

-- ---------- row level security ----------
alter table public.profiles enable row level security;
alter table public.listings enable row level security;
alter table public.claims enable row level security;
alter table public.subscriptions enable row level security;
alter table public.contact_clicks enable row level security;

create policy "own profile" on public.profiles for select using (id = auth.uid() or public.is_admin());
create policy "update own profile" on public.profiles for update using (id = auth.uid())
  with check (id = auth.uid() and role = (select role from public.profiles where id = auth.uid()));
create policy "admin manages profiles" on public.profiles for all using (public.is_admin());

create policy "public reads published" on public.listings for select using (status = 'published' or owner_id = auth.uid() or public.is_admin());
create policy "owner creates draft" on public.listings for insert with check (owner_id = auth.uid() and status in ('draft', 'pending') and plan = 'start');
create policy "owner edits own" on public.listings for update using (owner_id = auth.uid())
  with check (owner_id = auth.uid() and plan = (select plan from public.listings l where l.id = listings.id));
create policy "admin manages listings" on public.listings for all using (public.is_admin());

create policy "own claims" on public.claims for select using (user_id = auth.uid() or public.is_admin());
create policy "create own claim" on public.claims for insert with check (user_id = auth.uid() and status = 'pending');
create policy "admin manages claims" on public.claims for all using (public.is_admin());

create policy "owner sees own subscriptions" on public.subscriptions for select
  using (public.is_admin() or exists (select 1 from public.listings l where l.id = listing_id and l.owner_id = auth.uid()));
create policy "admin manages subscriptions" on public.subscriptions for all using (public.is_admin());

create policy "anyone logs a click" on public.contact_clicks for insert with check (true);
create policy "owner sees own clicks" on public.contact_clicks for select
  using (public.is_admin() or exists (select 1 from public.listings l where l.slug = listing_slug and l.owner_id = auth.uid()));

-- ---------- approving a claim hands the listing to the user ----------
create function public.approve_claim(claim_id bigint) returns void
language plpgsql security definer set search_path = '' as $$
declare c record;
begin
  if not public.is_admin() then raise exception 'admin only'; end if;
  select * into c from public.claims where id = claim_id;
  update public.claims set status = 'approved' where id = claim_id;
  update public.claims set status = 'rejected' where listing_id = c.listing_id and id <> claim_id and status = 'pending';
  update public.listings set owner_id = c.user_id, updated_at = now() where id = c.listing_id;
end $$;
