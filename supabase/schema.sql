-- Issykkul.Biz — database schema draft (Supabase / PostgreSQL).
-- Not applied yet. The site currently runs on demo data from src/lib/data.ts.

create type stay_type as enum ('hotel','guest','yurt','cottage','resort');
create type plan as enum ('start','standard','premium','driver');

-- One row per registered host or driver (linked to Supabase Auth).
create table profiles (
  id uuid primary key references auth.users on delete cascade,
  full_name text not null,
  phone text,
  role text not null default 'owner' check (role in ('owner','driver','admin')),
  created_at timestamptz not null default now()
);

create table villages (
  slug text primary key,
  name jsonb not null,            -- {"ru": "...", "en": "...", "ky": "..."}
  shore char(1) not null check (shore in ('n','s','e','w')),
  km_from_bishkek int,
  lat double precision, lng double precision
);

create table stays (
  id bigint generated always as identity primary key,
  owner_id uuid not null references profiles on delete cascade,
  slug text unique not null,
  village text not null references villages,
  type stay_type not null,
  name text not null,
  description jsonb not null default '{}',   -- per-locale text
  price_from int not null,
  season_prices jsonb,                       -- {"high": 8800, "mid": 6500, "low": 4500}
  amenities text[] not null default '{}',
  phone text, whatsapp text, telegram text,
  lat double precision, lng double precision,
  verified boolean not null default false,
  status text not null default 'pending' check (status in ('pending','published','hidden')),
  legacy_url text,                           -- old DotNetNuke URL, for 301 redirects
  created_at timestamptz not null default now()
);

create table stay_photos (
  id bigint generated always as identity primary key,
  stay_id bigint not null references stays on delete cascade,
  path text not null,                        -- Supabase Storage path
  position int not null default 0
);

create table drivers (
  id bigint generated always as identity primary key,
  owner_id uuid not null references profiles on delete cascade,
  name text not null, car text, seats int, years int,
  phone text, whatsapp text, telegram text,
  status text not null default 'pending'
);

create table driver_routes (
  driver_id bigint not null references drivers on delete cascade,
  from_place text not null, to_place text not null,
  price int not null,
  primary key (driver_id, from_place, to_place)
);

-- Paid plans. Activated manually by an admin after an MBank/Elsom/O!Dengi payment.
create table subscriptions (
  id bigint generated always as identity primary key,
  owner_id uuid not null references profiles on delete cascade,
  plan plan not null,
  starts_at date not null,
  ends_at date not null,
  amount int not null,
  payment_note text,
  created_at timestamptz not null default now()
);

-- WhatsApp/Telegram/phone clicks, shown to hosts as statistics.
create table contact_clicks (
  id bigint generated always as identity primary key,
  kind text not null check (kind in ('stay','driver')),
  target_id bigint not null,
  channel text not null check (channel in ('whatsapp','telegram','phone')),
  created_at timestamptz not null default now()
);

-- Row Level Security: public reads published listings; owners edit their own.
alter table stays enable row level security;
create policy "public read" on stays for select using (status = 'published');
create policy "owner write" on stays for all using (owner_id = auth.uid());
