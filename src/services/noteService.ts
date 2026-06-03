import { supabase } from '../lib/supabaseClient.js'
import type { Note } from '../types/note'

export async function fetchNotesByChapter(
  chapterId: string,
  username: string,
): Promise<{ data: Note[]; error: string | null }> {
  const { data, error } = await supabase
    .from('notes')
    .select('*')
    .eq('chapter_id', chapterId)
    .eq('username', username)
    .order('main_title', { ascending: true })

  if (error) return { data: [], error: error.message }
  return { data: (data as Note[]) ?? [], error: null }
}

export async function upsertNote(note: Note): Promise<{
  data: Note | null
  error: string | null
}> {
  if (!note.username || !note.chapter_id) {
    return {
      data: null,
      error: '챕터에 속한 노트만 저장할 수 있습니다. 사이드바에서 챕터와 노트를 선택해 주세요.',
    }
  }

  const { data, error } = await supabase
    .from('notes')
    .upsert(
      {
        id: note.id,
        chapter_id: note.chapter_id,
        username: note.username,
        main_title: note.main_title ?? '',
        sub_title: note.sub_title ?? '',
        keyword_content: note.keyword_content ?? '',
        notes_content: note.notes_content ?? '',
        summary_content: note.summary_content ?? '',
      },
      { onConflict: 'id' },
    )
    .select()
    .single()

  if (error) return { data: null, error: error.message }
  return { data: data as Note, error: null }
}

export async function deleteNote(
  id: string,
  username: string,
): Promise<{ error: string | null }> {
  const { error } = await supabase
    .from('notes')
    .delete()
    .eq('id', id)
    .eq('username', username)

  if (error) return { error: error.message }
  return { error: null }
}
