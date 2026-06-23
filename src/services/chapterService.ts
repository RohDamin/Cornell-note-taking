import { supabase } from '../lib/supabaseClient.js'
import type { Chapter } from '../types/chapter'

export function sortChaptersByName(chapters: Chapter[]): Chapter[] {
  return [...chapters].sort((a, b) =>
    a.name.localeCompare(b.name, 'ko', { numeric: true, sensitivity: 'base' }),
  )
}

export async function fetchChapters(
  userId: string,
): Promise<{ data: Chapter[]; error: string | null }> {
  const { data, error } = await supabase
    .from('chapters')
    .select('*')
    .eq('user_id', userId)

  if (error) return { data: [], error: error.message }
  return { data: sortChaptersByName((data as Chapter[]) ?? []), error: null }
}

export async function createChapter(
  userId: string,
  name: string,
): Promise<{ data: Chapter | null; error: string | null }> {
  const trimmed = name.trim()
  if (!trimmed) return { data: null, error: 'Please enter a chapter name.' }

  const { data, error } = await supabase
    .from('chapters')
    .insert({ name: trimmed, user_id: userId })
    .select()
    .single()

  if (error) return { data: null, error: error.message }
  return { data: data as Chapter, error: null }
}

export async function updateChapter(
  chapterId: string,
  userId: string,
  name: string,
): Promise<{ data: Chapter | null; error: string | null }> {
  const trimmed = name.trim()
  if (!trimmed) return { data: null, error: 'Please enter a chapter name.' }

  const { data, error } = await supabase
    .from('chapters')
    .update({ name: trimmed })
    .eq('id', chapterId)
    .eq('user_id', userId)
    .select()
    .single()

  if (error) return { data: null, error: error.message }
  return { data: data as Chapter, error: null }
}
