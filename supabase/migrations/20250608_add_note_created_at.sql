alter table public.notes
  add column if not exists created_at timestamptz not null default now();
