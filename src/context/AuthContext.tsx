import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { loginUser, logoutUser } from '../services/authService'

const AUTH_STORAGE_KEY = 'cornell-auth-username'

interface AuthContextValue {
  username: string | null
  isLoggedIn: boolean
  login: (username: string, password: string) => Promise<{ error: string | null }>
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

function readStoredUsername(): string | null {
  return localStorage.getItem(AUTH_STORAGE_KEY)
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [username, setUsername] = useState<string | null>(readStoredUsername)

  const login = useCallback(async (id: string, password: string) => {
    const result = await loginUser(id, password)
    if (result.error) return { error: result.error }
    localStorage.setItem(AUTH_STORAGE_KEY, result.username!)
    setUsername(result.username!)
    return { error: null }
  }, [])

  const logout = useCallback(() => {
    logoutUser()
    localStorage.removeItem(AUTH_STORAGE_KEY)
    setUsername(null)
  }, [])

  const value = useMemo(
    () => ({
      username,
      isLoggedIn: !!username,
      login,
      logout,
    }),
    [username, login, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
