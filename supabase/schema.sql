-- Supabase SQL Editor에서 실행하세요.
-- Supabase Auth 사용 (custom_users 테이블 불필요)

create table if not exists public.chapters (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  user_id uuid not null references auth.users (id) on delete cascade
);

create table if not exists public.notes (
  id uuid primary key default gen_random_uuid(),
  chapter_id uuid not null references public.chapters (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  main_title text,
  sub_title text,
  keyword_content text,
  notes_content text,
  summary_content text,
  extra_pages jsonb not null default '[]'::jsonb
);

-- 기존 DB에 extra_pages 컬럼이 없다면:
-- alter table public.notes add column if not exists extra_pages jsonb not null default '[]'::jsonb;

alter table public.chapters enable row level security;
alter table public.notes enable row level security;

create policy "Users manage own chapters"
  on public.chapters
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users manage own notes"
  on public.notes
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
