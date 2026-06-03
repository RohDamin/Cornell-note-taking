type SaveStatus = 'idle' | 'saving' | 'saved' | 'error'

interface TopBarProps {
  saveStatus: SaveStatus
  saveMessage: string | null
  isLoggedIn: boolean
  username: string | null
  onSave: () => void
  onPrint: () => void
  onLoginClick: () => void
  onLogout: () => void
}

function statusLabel(saveStatus: SaveStatus, saveMessage: string | null): string {
  if (saveMessage) return saveMessage
  if (saveStatus === 'saving') return '저장 중…'
  if (saveStatus === 'saved') return '저장됨'
  if (saveStatus === 'error') return '저장 실패'
  return ''
}

export default function TopBar({
  saveStatus,
  saveMessage,
  isLoggedIn,
  username,
  onSave,
  onPrint,
  onLoginClick,
  onLogout,
}: TopBarProps) {
  const message = statusLabel(saveStatus, saveMessage)
  const isError = saveStatus === 'error'

  return (
    <header className="print:hidden shrink-0 border-b border-slate-200 bg-white">
      <div className="flex h-14 items-center justify-between px-4">
        <h1 className="brand-logo select-none">Cornell Notes</h1>
        <div className="flex items-center gap-2">
          {message && (
            <span
              className={`max-w-xs truncate text-[10px] ${
                isError ? 'text-red-600' : 'text-slate-500'
              }`}
            >
              {message}
            </span>
          )}
          {isLoggedIn && username && (
            <span className="text-[10px] text-slate-400">{username}</span>
          )}
          <button
            type="button"
            onClick={onPrint}
            className="rounded-md border border-slate-300 bg-white px-1.5 py-1 text-[10px] text-slate-700 transition hover:bg-slate-50"
          >
            PDF Export
          </button>
          <button
            type="button"
            onClick={onSave}
            className="rounded-md border border-slate-300 bg-white px-1.5 py-1 text-[10px] text-slate-700 transition hover:bg-slate-50"
          >
            Save
          </button>
          {isLoggedIn ? (
            <button
              type="button"
              onClick={onLogout}
              className="rounded-md bg-slate-800 px-1.5 py-1 text-[10px] text-white transition hover:bg-slate-700"
            >
              Logout
            </button>
          ) : (
            <button
              type="button"
              onClick={onLoginClick}
              className="rounded-md bg-slate-800 px-1.5 py-1 text-[10px] text-white transition hover:bg-slate-700"
            >
              로그인
            </button>
          )}
        </div>
      </div>
    </header>
  )
}
