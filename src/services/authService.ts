import { supabase } from '../lib/supabaseClient.js'

export async function signUpWithEmail(
  email: string,
  password: string,
): Promise<{ error: string | null; needsEmailConfirmation: boolean }> {
  const trimmed = email.trim()
  if (!trimmed || !password) {
    return { error: 'Please enter your email and password.', needsEmailConfirmation: false }
  }

  const { data, error } = await supabase.auth.signUp({ email: trimmed, password })

  if (error) {
    return { error: error.message, needsEmailConfirmation: false }
  }

  return {
    error: null,
    needsEmailConfirmation: !data.session,
  }
}

export async function signInWithEmail(
  email: string,
  password: string,
): Promise<{ error: string | null }> {
  const trimmed = email.trim()
  if (!trimmed || !password) {
    return { error: 'Please enter your email and password.' }
  }

  const { error } = await supabase.auth.signInWithPassword({
    email: trimmed,
    password,
  })

  if (error) return { error: error.message }
  return { error: null }
}

export async function signOut(): Promise<{ error: string | null }> {
  const { error } = await supabase.auth.signOut()
  if (error) return { error: error.message }
  return { error: null }
}
