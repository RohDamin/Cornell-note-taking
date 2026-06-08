import { supabase } from '../lib/supabaseClient.js'
import { normalizeNote, type Note } from '../types/note'

function noteSaveErrorMessage(message: string): string {
  if (message.includes("'extra_pages'") || message.includes('extra_pages')) {
    return (
      'Database is missing the extra_pages column. ' +
      'Open Supabase → SQL Editor and run supabase/migrations/20250608_add_extra_pages.sql'
    )
  }
  return message
}

export async function fetchNotesByChapter(
  chapterId: string,
  userId: string,
): Promise<{ data: Note[]; error: string | null }> {
  const { data, error } = await supabase
    .from('notes')
    .select('*')
    .eq('chapter_id', chapterId)
    .eq('user_id', userId)
    .order('main_title', { ascending: true })

  if (error) return { data: [], error: noteSaveErrorMessage(error.message) }
  return {
    data: ((data as Note[]) ?? []).map(normalizeNote),
    error: null,
  }
}

export async function upsertNote(note: Note): Promise<{
  data: Note | null
  error: string | null
}> {
  if (!note.user_id || !note.chapter_id) {
    return {
      data: null,
      error: 'You can only save notes in a chapter. Select a chapter and note from the sidebar.',
    }
  }

  const { data, error } = await supabase
    .from('notes')
    .upsert(
      {
        id: note.id,
        chapter_id: note.chapter_id,
        user_id: note.user_id,
        main_title: note.main_title ?? '',
        sub_title: note.sub_title ?? '',
        keyword_content: note.keyword_content ?? '',
        notes_content: note.notes_content ?? '',
        summary_content: note.summary_content ?? '',
        extra_pages: note.extra_pages ?? [],
      },
      { onConflict: 'id' },
    )
    .select()
    .single()

  if (error) return { data: null, error: noteSaveErrorMessage(error.message) }
  return { data: normalizeNote(data as Note), error: null }
}

export async function deleteNote(
  id: string,
  userId: string,
): Promise<{ error: string | null }> {
  const { error } = await supabase
    .from('notes')
    .delete()
    .eq('id', id)
    .eq('user_id', userId)

  if (error) return { error: error.message }
  return { error: null }
}
