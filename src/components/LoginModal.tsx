import { useEffect, useState, type FormEvent } from 'react'

export type AuthModalTab = 'login' | 'signup'

interface LoginModalProps {
  open: boolean
  initialTab?: AuthModalTab
  onClose: () => void
  onSignIn: (email: string, password: string) => Promise<{ error: string | null }>
  onSignUp: (
    email: string,
    password: string,
  ) => Promise<{ error: string | null; needsEmailConfirmation?: boolean }>
}

export default function LoginModal({
  open,
  initialTab = 'login',
  onClose,
  onSignIn,
  onSignUp,
}: LoginModalProps) {
  const [tab, setTab] = useState<AuthModalTab>(initialTab)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (open) {
      setTab(initialTab)
      setError(null)
      setInfo(null)
    }
  }, [open, initialTab])

  if (!open) return null

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    setInfo(null)
    setLoading(true)

    if (tab === 'signup') {
      const result = await onSignUp(email, password)
      setLoading(false)
      if (result.error) {
        setError(result.error)
        return
      }
      if (result.needsEmailConfirmation) {
        setInfo('We sent a confirmation email. Please verify your inbox, then log in.')
        setTab('login')
        setPassword('')
        return
      }
      setEmail('')
      setPassword('')
      onClose()
      return
    }

    const result = await onSignIn(email, password)
    setLoading(false)
    if (result.error) {
      setError(result.error)
      return
    }
    setEmail('')
    setPassword('')
    onClose()
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 print:hidden"
      role="dialog"
      aria-modal
      aria-labelledby="auth-modal-title"
    >
      <div className="w-full max-w-sm rounded-lg bg-white p-6 shadow-xl">
        <h2 id="auth-modal-title" className="text-base font-semibold text-slate-800">
          {tab === 'login' ? 'Log in' : 'Sign up'}
        </h2>

        <div className="mt-4 flex rounded-md border border-slate-200 p-0.5">
          <button
            type="button"
            onClick={() => {
              setTab('login')
              setError(null)
              setInfo(null)
            }}
            className={`flex-1 rounded py-1.5 text-xs transition ${
              tab === 'login'
                ? 'bg-slate-800 text-white'
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            Log in
          </button>
          <button
            type="button"
            onClick={() => {
              setTab('signup')
              setError(null)
              setInfo(null)
            }}
            className={`flex-1 rounded py-1.5 text-xs transition ${
              tab === 'signup'
                ? 'bg-slate-800 text-white'
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            Sign up
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-3">
          <div>
            <label htmlFor="auth-email" className="mb-1 block text-xs text-slate-600">
              Email
            </label>
            <input
              id="auth-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              required
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500"
            />
          </div>
          <div>
            <label
              htmlFor="auth-password"
              className="mb-1 block text-xs text-slate-600"
            >
              Password
            </label>
            <input
              id="auth-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete={
                tab === 'login' ? 'current-password' : 'new-password'
              }
              required
              minLength={6}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500"
            />
          </div>

          {error && (
            <p className="text-xs text-red-600" role="alert">
              {error}
            </p>
          )}
          {info && (
            <p className="text-xs text-slate-600" role="status">
              {info}
            </p>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="rounded-md bg-slate-800 px-3 py-1.5 text-xs text-white hover:bg-slate-700 disabled:opacity-60"
            >
              {loading
                ? 'Processing…'
                : tab === 'login'
                  ? 'Log in'
                  : 'Sign up'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
