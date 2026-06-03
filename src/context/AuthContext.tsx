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
  signInWithEmail,
  signOut,
  signUpWithEmail,
} from '../services/authService'

interface AuthContextValue {
  user: User | null
  session: Session | null
  userId: string | null
  email: string | null
  isLoggedIn: boolean
  loading: boolean
  signUp: (
    email: string,
    password: string,
  ) => Promise<{ error: string | null; needsEmailConfirmation?: boolean }>
  signIn: (email: string, password: string) => Promise<{ error: string | null }>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setUser(data.session?.user ?? null)
      setLoading(false)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession)
      setUser(nextSession?.user ?? null)
      setLoading(false)
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
      signUp,
      signIn,
      logout,
    }),
    [user, session, loading, signUp, signIn, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
