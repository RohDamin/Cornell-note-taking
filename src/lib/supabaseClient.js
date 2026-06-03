import { createClient } from '@supabase/supabase-js'
import { getSupabaseEnv, isValidSupabaseAnonKey } from './supabaseConfig.ts'

const { url: supabaseUrl, anonKey: supabaseAnonKey } = getSupabaseEnv()

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    '[Supabase] VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY is not set.',
  )
} else if (!isValidSupabaseAnonKey(supabaseAnonKey)) {
  console.warn(
    '[Supabase] Invalid anon key format. Use the anon public JWT from the dashboard.',
  )
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
