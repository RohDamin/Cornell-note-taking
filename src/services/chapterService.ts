import { supabase } from '../lib/supabaseClient.js'
import type { Chapter } from '../types/chapter'

export async function fetchChapters(
  username: string,
): Promise<{ data: Chapter[]; error: string | null }> {
  const { data, error } = await supabase
    .from('chapters')
    .select('*')
    .eq('username', username)
    .order('name', { ascending: true })

  if (error) return { data: [], error: error.message }
  return { data: (data as Chapter[]) ?? [], error: null }
}

export async function createChapter(
  username: string,
  name: string,
): Promise<{ data: Chapter | null; error: string | null }> {
  const trimmed = name.trim()
  if (!trimmed) return { data: null, error: '챕터 이름을 입력해 주세요.' }

  const { data, error } = await supabase
    .from('chapters')
    .insert({ name: trimmed, username })
    .select()
    .single()

  if (error) return { data: null, error: error.message }
  return { data: data as Chapter, error: null }
}
