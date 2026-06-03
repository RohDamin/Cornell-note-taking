import { useState, type FormEvent } from 'react'

interface LoginModalProps {
  open: boolean
  onClose: () => void
  onLogin: (
    username: string,
    password: string,
  ) => Promise<{ error: string | null }>
}

export default function LoginModal({ open, onClose, onLogin }: LoginModalProps) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  if (!open) return null

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    const result = await onLogin(username, password)
    setLoading(false)
    if (result.error) {
      setError(result.error)
      return
    }
    setUsername('')
    setPassword('')
    onClose()
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 print:hidden"
      role="dialog"
      aria-modal
      aria-labelledby="login-title"
    >
      <div className="w-full max-w-sm rounded-lg bg-white p-6 shadow-xl">
        <h2 id="login-title" className="text-base font-semibold text-slate-800">
          로그인
        </h2>
        <p className="mt-1 text-xs text-slate-500">
          아이디와 비밀번호를 입력해 주세요.
        </p>

        <form onSubmit={handleSubmit} className="mt-4 space-y-3">
          <div>
            <label
              htmlFor="login-username"
              className="mb-1 block text-xs text-slate-600"
            >
              아이디
            </label>
            <input
              id="login-username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500"
            />
          </div>
          <div>
            <label
              htmlFor="login-password"
              className="mb-1 block text-xs text-slate-600"
            >
              비밀번호
            </label>
            <input
              id="login-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500"
            />
          </div>

          {error && (
            <p className="text-xs text-red-600" role="alert">
              {error}
            </p>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={loading}
              className="rounded-md bg-slate-800 px-3 py-1.5 text-xs text-white hover:bg-slate-700 disabled:opacity-60"
            >
              {loading ? '확인 중…' : '로그인'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
