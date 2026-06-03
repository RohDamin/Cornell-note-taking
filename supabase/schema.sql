-- Supabase SQL Editor에서 실행하세요.

create table if not exists public.custom_users (
  username text primary key,
  password text not null
);

create table if not exists public.chapters (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  username text not null references public.custom_users (username) on delete cascade
);

create table if not exists public.notes (
  id uuid primary key default gen_random_uuid(),
  chapter_id uuid not null references public.chapters (id) on delete cascade,
  username text not null references public.custom_users (username) on delete cascade,
  main_title text,
  sub_title text,
  keyword_content text,
  notes_content text,
  summary_content text
);

alter table public.custom_users enable row level security;
alter table public.chapters enable row level security;
alter table public.notes enable row level security;

create policy "Allow all on custom_users"
  on public.custom_users for all using (true) with check (true);

create policy "Allow all on chapters"
  on public.chapters for all using (true) with check (true);

create policy "Allow all on notes"
  on public.notes for all using (true) with check (true);
