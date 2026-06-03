/** Supabase anon 키는 JWT 형태(점 2개 포함, 길이 100자 이상) */
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
  if (!url) return 'VITE_SUPABASE_URL이 .env에 없습니다.'
  if (!anonKey) return 'VITE_SUPABASE_ANON_KEY가 .env에 없습니다.'
  if (!isValidSupabaseAnonKey(anonKey)) {
    return 'VITE_SUPABASE_ANON_KEY가 올바르지 않습니다. Supabase 대시보드 → Project Settings → API → anon public 키(eyJ…로 시작)를 복사해 넣고 개발 서버를 재시작하세요.'
  }
  return null
}
