alter table public.notes
  add column if not exists deleted_at timestamptz;

create index if not exists notes_active_by_chapter_idx
  on public.notes (chapter_id, user_id, created_at)
  where deleted_at is null;
