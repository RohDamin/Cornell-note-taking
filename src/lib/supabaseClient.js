import { createClient } from '@supabase/supabase-js'
import { getSupabaseEnv, isValidSupabaseAnonKey } from './supabaseConfig.ts'

const { url: supabaseUrl, anonKey: supabaseAnonKey } = getSupabaseEnv()

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    '[Supabase] VITE_SUPABASE_URL 또는 VITE_SUPABASE_ANON_KEY가 설정되지 않았습니다.',
  )
} else if (!isValidSupabaseAnonKey(supabaseAnonKey)) {
  console.warn(
    '[Supabase] anon 키 형식이 올바르지 않습니다. 대시보드의 anon public JWT 키를 사용하세요.',
  )
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
