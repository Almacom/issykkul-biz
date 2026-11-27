-- Reviews written by tourists on the new site. They are published after the admin approves them.
create table if not exists public.reviews (
  id bigint generated always as identity primary key,
  listing_slug text not null,
  author text not null check (char_length(author) between 2 and 60),
  from_place text check (char_length(from_place) <= 80),
  traveled_with text check (char_length(traveled_with) <= 40),
  stay_month text check (char_length(stay_month) <= 20),
  rating smallint not null check (rating between 1 and 5),
  title text check (char_length(title) <= 120),
  text text not null check (char_length(text) between 20 and 5000),
  status text not null default 'pending' check (status in ('pending', 'published', 'rejected')),
  created_at timestamptz not null default now()
);
create index if not exists reviews_slug_idx on public.reviews (listing_slug, status);

alter table public.reviews enable row level security;
-- anyone (no sign-in) may send a review; it always starts as pending
create policy "anyone sends a review" on public.reviews for insert with check (status = 'pending');
create policy "public reads published reviews" on public.reviews for select using (status = 'published' or public.is_admin());
create policy "admin manages reviews" on public.reviews for all using (public.is_admin());
