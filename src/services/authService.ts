import type { AuthError } from '@supabase/supabase-js'
import { supabase } from '../lib/supabaseClient.js'

function isDuplicateEmailError(error: AuthError): boolean {
  return (
    error.message === 'User already exists' ||
    error.message === 'User already registered' ||
    error.code === 'user_already_exists'
  )
}

function isEmailSignupDisabledError(error: AuthError): boolean {
  return (
    error.message === 'Email signups are disabled' ||
    error.message.toLowerCase().includes('signups are disabled')
  )
}

function isEmailNotConfirmedError(error: AuthError): boolean {
  return (
    error.message === 'Email not confirmed' ||
    error.code === 'email_not_confirmed'
  )
}

function authErrorAlertMessage(error: AuthError): string {
  if (isDuplicateEmailError(error)) {
    return 'This email is already registered.'
  }
  if (isEmailSignupDisabledError(error)) {
    return (
      'Email sign-up is disabled in Supabase. ' +
      'Turn on "Allow new users to sign up" under Authentication → Providers → Email.'
    )
  }
  if (isEmailNotConfirmedError(error)) {
    return (
      'Please confirm your email first. Check your inbox for the confirmation link, ' +
      'then try logging in again.'
    )
  }
  return error.message
}

function signInErrorMessage(error: AuthError): string {
  if (isEmailNotConfirmedError(error)) {
    return (
      'Email not confirmed. Open the confirmation link we sent to your inbox, ' +
      'or ask the site admin to turn off "Confirm email" in Supabase.'
    )
  }
  return error.message
}

export function isPasswordRecoveryUrl(): boolean {
  if (typeof window === 'undefined') return false
  const hash = window.location.hash.replace(/^#/, '')
  if (!hash) return false
  return new URLSearchParams(hash).get('type') === 'recovery'
}

export function clearAuthHashFromUrl(): void {
  if (typeof window === 'undefined') return
  window.history.replaceState(
    window.history.state,
    document.title,
    window.location.pathname + window.location.search,
  )
}

export async function signUpWithEmail(
  email: string,
  password: string,
): Promise<{ error: string | null; needsEmailConfirmation: boolean }> {
  const trimmed = email.trim()
  if (!trimmed || !password) {
    return { error: 'Please enter your email and password.', needsEmailConfirmation: false }
  }

  const { data, error } = await supabase.auth.signUp({
    email: trimmed,
    password,
  })

  if (error) {
    alert(authErrorAlertMessage(error))
    return { error: error.message, needsEmailConfirmation: false }
  }

  const needsEmailConfirmation = !data.session
  if (needsEmailConfirmation) {
    alert(
      'Account created. Check your email and click the confirmation link before logging in.',
    )
  } else {
    alert('Sign up completed!')
  }
  return {
    error: null,
    needsEmailConfirmation,
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

  if (error) return { error: signInErrorMessage(error) }
  return { error: null }
}

export async function requestPasswordReset(
  email: string,
): Promise<{ error: string | null }> {
  const trimmed = email.trim()
  if (!trimmed) {
    return { error: 'Please enter your email.' }
  }

  const redirectTo =
    typeof window !== 'undefined' ? window.location.origin : undefined

  const { error } = await supabase.auth.resetPasswordForEmail(trimmed, {
    redirectTo,
  })

  if (error) return { error: error.message }
  return { error: null }
}

export async function updateUserPassword(
  password: string,
): Promise<{ error: string | null }> {
  if (!password) {
    return { error: 'Please enter a new password.' }
  }
  if (password.length < 6) {
    return { error: 'Password must be at least 6 characters.' }
  }

  const { error } = await supabase.auth.updateUser({ password })

  if (error) return { error: error.message }
  return { error: null }
}

export async function signOut(): Promise<{ error: string | null }> {
  const { error } = await supabase.auth.signOut()
  if (error) return { error: error.message }
  return { error: null }
}
