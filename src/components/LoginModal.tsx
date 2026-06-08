import { useEffect, useState, type FormEvent } from 'react'
import PasswordField from './PasswordField'

export type AuthModalTab = 'login' | 'signup'

type AuthView = AuthModalTab | 'forgot' | 'reset'

interface LoginModalProps {
  open: boolean
  initialTab?: AuthModalTab
  forceResetView?: boolean
  forceForgotView?: boolean
  initialError?: string | null
  onClose: () => void
  onDismissRecovery?: () => void
  onDismissCallbackError?: () => void
  onSignIn: (email: string, password: string) => Promise<{ error: string | null }>
  onSignUp: (
    email: string,
    password: string,
  ) => Promise<{ error: string | null; needsEmailConfirmation?: boolean }>
  onRequestPasswordReset: (email: string) => Promise<{ error: string | null }>
  onUpdatePassword: (password: string) => Promise<{ error: string | null }>
}

function passwordsMatch(password: string, confirm: string): boolean {
  return password === confirm
}

export default function LoginModal({
  open,
  initialTab = 'login',
  forceResetView = false,
  forceForgotView = false,
  initialError = null,
  onClose,
  onDismissRecovery,
  onDismissCallbackError,
  onSignIn,
  onSignUp,
  onRequestPasswordReset,
  onUpdatePassword,
}: LoginModalProps) {
  const [view, setView] = useState<AuthView>(initialTab)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmNewPassword, setConfirmNewPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmNewPassword, setShowConfirmNewPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const resetFormFields = () => {
    setPassword('')
    setConfirmPassword('')
    setNewPassword('')
    setConfirmNewPassword('')
    setShowPassword(false)
    setShowConfirmPassword(false)
    setShowNewPassword(false)
    setShowConfirmNewPassword(false)
    setError(null)
    setInfo(null)
  }

  useEffect(() => {
    if (!open) return
    if (forceResetView) {
      setView('reset')
    } else if (forceForgotView) {
      setView('forgot')
    } else {
      setView(initialTab)
    }
    resetFormFields()
    if (initialError) {
      setError(initialError)
    }
  }, [open, initialTab, forceResetView, forceForgotView, initialError])

  useEffect(() => {
    if (forceResetView) {
      setView('reset')
    } else if (forceForgotView) {
      setView('forgot')
    }
  }, [forceResetView, forceForgotView])

  useEffect(() => {
    if (open && initialError) {
      setError(initialError)
    }
  }, [open, initialError])

  if (!open) return null

  const handleClose = () => {
    resetFormFields()
    if (forceResetView) {
      onDismissRecovery?.()
    }
    if (forceForgotView) {
      onDismissCallbackError?.()
    }
    onClose()
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    setInfo(null)

    if (view === 'forgot') {
      setLoading(true)
      const result = await onRequestPasswordReset(email)
      setLoading(false)
      if (result.error) {
        setError(result.error)
        return
      }
      onDismissCallbackError?.()
      alert('A password reset email has been sent.')
      setView('login')
      return
    }

    if (view === 'reset') {
      if (!passwordsMatch(newPassword, confirmNewPassword)) {
        alert('Passwords do not match.')
        return
      }
      setLoading(true)
      const result = await onUpdatePassword(newPassword)
      setLoading(false)
      if (result.error) {
        setError(result.error)
        return
      }
      setInfo('Your password has been updated. You are now logged in.')
      setNewPassword('')
      setConfirmNewPassword('')
      onDismissRecovery?.()
      setTimeout(() => {
        handleClose()
      }, 1200)
      return
    }

    if (view === 'signup') {
      if (!passwordsMatch(password, confirmPassword)) {
        alert('Passwords do not match.')
        return
      }
      setLoading(true)
      const result = await onSignUp(email, password)
      setLoading(false)
      if (result.error) {
        return
      }
      if (result.needsEmailConfirmation) {
        setInfo('We sent a confirmation email. Please verify your inbox, then log in.')
        setView('login')
        setPassword('')
        setConfirmPassword('')
        return
      }
      setEmail('')
      resetFormFields()
      onClose()
      return
    }

    setLoading(true)
    const result = await onSignIn(email, password)
    setLoading(false)
    if (result.error) {
      setError(result.error)
      return
    }
    setEmail('')
    resetFormFields()
    onClose()
  }

  const title =
    view === 'reset'
      ? 'Set new password'
      : view === 'forgot'
        ? 'Reset password'
        : view === 'login'
          ? 'Log in'
          : 'Sign up'

  const submitLabel =
    loading
      ? 'Processing…'
      : view === 'reset'
        ? 'Update password'
        : view === 'forgot'
          ? 'Send reset email'
          : view === 'login'
            ? 'Log in'
            : 'Sign up'

  const showTabSwitcher = view === 'login' || view === 'signup'

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 print:hidden"
      role="dialog"
      aria-modal
      aria-labelledby="auth-modal-title"
    >
      <div className="w-full max-w-sm rounded-lg bg-white p-6 shadow-xl">
        <h2 id="auth-modal-title" className="text-lg font-semibold text-slate-800">
          {title}
        </h2>

        {view === 'reset' && (
          <p className="mt-2 text-[15px] leading-relaxed text-slate-500">
            Enter a new password for your account.
          </p>
        )}

        {showTabSwitcher && (
          <div className="mt-4 flex rounded-md border border-slate-200 p-0.5">
            <button
              type="button"
              onClick={() => {
                setView('login')
                setError(null)
                setInfo(null)
                setConfirmPassword('')
              }}
              className={`flex-1 rounded py-2 text-[17px] transition ${
                view === 'login'
                  ? 'bg-slate-800 text-white'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              Log in
            </button>
            <button
              type="button"
              onClick={() => {
                setView('signup')
                setError(null)
                setInfo(null)
              }}
              className={`flex-1 rounded py-2 text-[17px] transition ${
                view === 'signup'
                  ? 'bg-slate-800 text-white'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              Sign up
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-3">
          {(view === 'login' || view === 'signup' || view === 'forgot') && (
            <div>
              <label htmlFor="auth-email" className="mb-1 block text-[17px] text-slate-600">
                Email
              </label>
              <input
                id="auth-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                required
                className="w-full rounded-md border border-slate-300 px-3 py-2.5 text-[17px] outline-none focus:border-slate-500"
              />
            </div>
          )}

          {view === 'login' && (
            <PasswordField
              id="auth-password"
              label="Password"
              value={password}
              onChange={setPassword}
              visible={showPassword}
              onToggleVisible={() => setShowPassword((v) => !v)}
              autoComplete="current-password"
            />
          )}

          {view === 'signup' && (
            <>
              <PasswordField
                id="auth-password"
                label="Password"
                value={password}
                onChange={setPassword}
                visible={showPassword}
                onToggleVisible={() => setShowPassword((v) => !v)}
                autoComplete="new-password"
              />
              <PasswordField
                id="auth-confirm-password"
                label="Confirm Password"
                value={confirmPassword}
                onChange={setConfirmPassword}
                visible={showConfirmPassword}
                onToggleVisible={() => setShowConfirmPassword((v) => !v)}
                autoComplete="new-password"
              />
            </>
          )}

          {view === 'reset' && (
            <>
              <PasswordField
                id="auth-new-password"
                label="New password"
                value={newPassword}
                onChange={setNewPassword}
                visible={showNewPassword}
                onToggleVisible={() => setShowNewPassword((v) => !v)}
                autoComplete="new-password"
              />
              <PasswordField
                id="auth-confirm-new-password"
                label="Confirm Password"
                value={confirmNewPassword}
                onChange={setConfirmNewPassword}
                visible={showConfirmNewPassword}
                onToggleVisible={() => setShowConfirmNewPassword((v) => !v)}
                autoComplete="new-password"
              />
            </>
          )}

          {error && (
            <p className="text-[17px] text-red-600" role="alert">
              {error}
            </p>
          )}
          {info && (
            <p className="text-[17px] text-slate-600" role="status">
              {info}
            </p>
          )}

          <div className="flex justify-end gap-2 pt-2">
            {view === 'forgot' ? (
              <button
                type="button"
                onClick={() => {
                  setView('login')
                  setError(null)
                  setInfo(null)
                }}
                className="rounded-md px-3 py-2 text-[17px] text-slate-600 hover:bg-slate-100"
              >
                Back to log in
              </button>
            ) : (
              <button
                type="button"
                onClick={handleClose}
                className="rounded-md px-3 py-2 text-[17px] text-slate-600 hover:bg-slate-100"
              >
                Cancel
              </button>
            )}
            <button
              type="submit"
              disabled={loading}
              className="rounded-md bg-slate-800 px-3 py-2 text-[17px] text-white hover:bg-slate-700 disabled:opacity-60"
            >
              {submitLabel}
            </button>
          </div>
        </form>

        {view === 'login' && (
          <p className="mt-4 text-center">
            <button
              type="button"
              onClick={() => {
                setView('forgot')
                setError(null)
                setInfo(null)
                setPassword('')
              }}
              className="text-[15px] text-slate-500 underline-offset-2 transition hover:text-slate-800 hover:underline"
            >
              Forgot Password?
            </button>
          </p>
        )}
      </div>
    </div>
  )
}
