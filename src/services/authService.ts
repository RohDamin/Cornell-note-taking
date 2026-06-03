import { supabase } from '../lib/supabaseClient.js'

export async function loginUser(
  username: string,
  password: string,
): Promise<{ username: string | null; error: string | null }> {
  const trimmed = username.trim()
  if (!trimmed || !password) {
    return { username: null, error: '아이디와 비밀번호를 입력해 주세요.' }
  }

  const { data, error } = await supabase
    .from('custom_users')
    .select('username')
    .eq('username', trimmed)
    .eq('password', password)
    .maybeSingle()

  if (error) {
    return { username: null, error: error.message }
  }
  if (!data) {
    return {
      username: null,
      error: '아이디 또는 비밀번호가 올바르지 않습니다.',
    }
  }

  return { username: data.username, error: null }
}

export function logoutUser(): void {
  /* 상태는 AuthContext에서 처리 */
}
