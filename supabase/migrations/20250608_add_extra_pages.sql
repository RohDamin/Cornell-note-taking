-- Run in Supabase Dashboard → SQL Editor
-- Adds multi-page support to notes (page 2+ stored as JSON array)

alter table public.notes
  add column if not exists extra_pages jsonb not null default '[]'::jsonb;

-- Refresh PostgREST schema cache so the API sees the new column immediately
notify pgrst, 'reload schema';
