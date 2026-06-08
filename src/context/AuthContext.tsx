import type { Session, User } from '@supabase/supabase-js'
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { supabase } from '../lib/supabaseClient.js'
import {
  clearAuthHashFromUrl,
  getAuthHashError,
  isPasswordRecoveryUrl,
  requestPasswordReset,
  signInWithEmail,
  signOut,
  signUpWithEmail,
  updateUserPassword,
} from '../services/authService'

interface AuthContextValue {
  user: User | null
  session: Session | null
  userId: string | null
  email: string | null
  isLoggedIn: boolean
  loading: boolean
  needsPasswordReset: boolean
  authCallbackError: string | null
  signUp: (
    email: string,
    password: string,
  ) => Promise<{ error: string | null; needsEmailConfirmation?: boolean }>
  signIn: (email: string, password: string) => Promise<{ error: string | null }>
  requestPasswordResetEmail: (
    email: string,
  ) => Promise<{ error: string | null }>
  updatePassword: (password: string) => Promise<{ error: string | null }>
  dismissPasswordRecovery: () => void
  dismissAuthCallbackError: () => void
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [needsPasswordReset, setNeedsPasswordReset] = useState(
    () => isPasswordRecoveryUrl(),
  )
  const [authCallbackError, setAuthCallbackError] = useState<string | null>(
    () => getAuthHashError(),
  )

  useEffect(() => {
    const hashError = getAuthHashError()
    if (hashError) {
      setAuthCallbackError(hashError)
      clearAuthHashFromUrl()
    }

    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setUser(data.session?.user ?? null)
      if (isPasswordRecoveryUrl()) {
        setNeedsPasswordReset(true)
      }
      setLoading(false)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, nextSession) => {
      setSession(nextSession)
      setUser(nextSession?.user ?? null)
      setLoading(false)

      if (event === 'PASSWORD_RECOVERY' || isPasswordRecoveryUrl()) {
        setNeedsPasswordReset(true)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const signUp = useCallback(async (email: string, password: string) => {
    const result = await signUpWithEmail(email, password)
    if (result.error) return { error: result.error }
    if (result.needsEmailConfirmation) {
      return { error: null, needsEmailConfirmation: true }
    }
    return { error: null }
  }, [])

  const signIn = useCallback(async (email: string, password: string) => {
    return signInWithEmail(email, password)
  }, [])

  const requestPasswordResetEmail = useCallback(async (email: string) => {
    return requestPasswordReset(email)
  }, [])

  const updatePassword = useCallback(async (password: string) => {
    const result = await updateUserPassword(password)
    if (!result.error) {
      setNeedsPasswordReset(false)
      clearAuthHashFromUrl()
    }
    return result
  }, [])

  const dismissPasswordRecovery = useCallback(() => {
    setNeedsPasswordReset(false)
    clearAuthHashFromUrl()
  }, [])

  const dismissAuthCallbackError = useCallback(() => {
    setAuthCallbackError(null)
    clearAuthHashFromUrl()
  }, [])

  const logout = useCallback(async () => {
    await signOut()
  }, [])

  const value = useMemo(
    () => ({
      user,
      session,
      userId: user?.id ?? null,
      email: user?.email ?? null,
      isLoggedIn: !!user,
      loading,
      needsPasswordReset,
      authCallbackError,
      signUp,
      signIn,
      requestPasswordResetEmail,
      updatePassword,
      dismissPasswordRecovery,
      dismissAuthCallbackError,
      logout,
    }),
    [
      user,
      session,
      loading,
      needsPasswordReset,
      authCallbackError,
      signUp,
      signIn,
      requestPasswordResetEmail,
      updatePassword,
      dismissPasswordRecovery,
      dismissAuthCallbackError,
      logout,
    ],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
