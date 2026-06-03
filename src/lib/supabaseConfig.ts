/** Supabase anon key must be a JWT (three segments, 100+ chars). */
export function isValidSupabaseAnonKey(key: string): boolean {
  return key.length >= 100 && key.split('.').length === 3
}

export function getSupabaseEnv() {
  const rawUrl = import.meta.env.VITE_SUPABASE_URL ?? ''
  const url = rawUrl.replace(/\/rest\/v1\/?$/, '')
  const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY ?? ''
  return { url, anonKey }
}

export function getSupabaseConfigError(): string | null {
  const { url, anonKey } = getSupabaseEnv()
  if (!url) return 'VITE_SUPABASE_URL is missing from .env.'
  if (!anonKey) return 'VITE_SUPABASE_ANON_KEY is missing from .env.'
  if (!isValidSupabaseAnonKey(anonKey)) {
    return 'VITE_SUPABASE_ANON_KEY is invalid. Copy the anon public key from Supabase → Project Settings → API, then restart the dev server.'
  }
  return null
}
