import { useCallback, useEffect, useRef, useState } from 'react'
import ChapterPrintView from './components/ChapterPrintView'
import ContactLink from './components/ContactLink'
import LoginModal, { type AuthModalTab } from './components/LoginModal'
import NoteEditor from './components/NoteEditor'
import NoteSidebar from './components/NoteSidebar'
import TopBar from './components/TopBar'
import { useAuth } from './context/AuthContext'
import { createChapter, fetchChapters } from './services/chapterService'
import { fetchNotesByChapter, upsertNote } from './services/noteService'
import {
  createEmptyNote,
  isNoteEditable,
  type Note,
  type NoteField,
} from './types/note'
import type { Chapter } from './types/chapter'

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error'

export default function App() {
  const {
    userId,
    email,
    isLoggedIn,
    loading,
    signIn,
    signUp,
    logout,
    needsPasswordReset,
    requestPasswordResetEmail,
    updatePassword,
    dismissPasswordRecovery,
  } = useAuth()

  const [authOpen, setAuthOpen] = useState(false)
  const [authTab, setAuthTab] = useState<AuthModalTab>('login')
  const [chapters, setChapters] = useState<Chapter[]>([])
  const [notesByChapter, setNotesByChapter] = useState<Record<string, Note[]>>({})
  const [expandedChapterIds, setExpandedChapterIds] = useState<Set<string>>(
    new Set(),
  )
  const [loadingChapterId, setLoadingChapterId] = useState<string | null>(null)

  const [currentNote, setCurrentNote] = useState<Note>(createEmptyNote())
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle')
  const [saveMessage, setSaveMessage] = useState<string | null>(null)
  const [printQueue, setPrintQueue] = useState<Note[] | null>(null)

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const currentNoteRef = useRef(currentNote)
  const noteScrollRef = useRef<HTMLDivElement>(null)
  const [showContact, setShowContact] = useState(false)
  useEffect(() => {
    currentNoteRef.current = currentNote
  }, [currentNote])

  const readOnly = !isNoteEditable(currentNote, userId)

  const openAuthModal = (tab: AuthModalTab) => {
    setAuthTab(tab)
    setAuthOpen(true)
  }

  useEffect(() => {
    if (needsPasswordReset) {
      setAuthOpen(true)
    }
  }, [needsPasswordReset])

  const loadChapters = useCallback(async () => {
    if (!userId) return
    const { data, error } = await fetchChapters(userId)
    if (error) {
      setSaveMessage(error)
      return
    }
    setChapters(data)
  }, [userId])

  const loadNotesForChapter = useCallback(
    async (chapterId: string) => {
      if (!userId) return
      setLoadingChapterId(chapterId)
      const { data, error } = await fetchNotesByChapter(chapterId, userId)
      setLoadingChapterId(null)
      if (error) {
        setSaveMessage(error)
        return
      }
      setNotesByChapter((prev) => ({ ...prev, [chapterId]: data }))
    },
    [userId],
  )

  useEffect(() => {
    if (isLoggedIn && userId) {
      loadChapters()
    } else if (!loading) {
      setChapters([])
      setNotesByChapter({})
      setExpandedChapterIds(new Set())
    }
  }, [isLoggedIn, userId, loading, loadChapters])

  const persistNote = useCallback(
    async (note: Note) => {
      if (!isLoggedIn || !userId) return

      if (!isNoteEditable(note, userId)) {
        setSaveStatus('error')
        setSaveMessage('You cannot edit this note.')
        return
      }

      if (!note.chapter_id) {
        setSaveStatus('error')
        setSaveMessage('You can only save notes that belong to a chapter.')
        return
      }

      const toSave: Note = { ...note, user_id: userId }

      setSaveStatus('saving')
      setSaveMessage(null)

      const { data, error } = await upsertNote(toSave)

      if (error) {
        setSaveStatus('error')
        setSaveMessage(error)
        return
      }

      setSaveStatus('saved')
      setSaveMessage(null)
      if (data) {
        setCurrentNote(data)
        setNotesByChapter((prev) => {
          const list = prev[data.chapter_id!] ?? []
          const idx = list.findIndex((n) => n.id === data.id)
          const next =
            idx >= 0
              ? list.map((n, i) => (i === idx ? data : n))
              : [...list, data]
          return { ...prev, [data.chapter_id!]: next }
        })
      }
      window.setTimeout(() => setSaveStatus('idle'), 2000)
    },
    [isLoggedIn, userId],
  )

  const scheduleAutoSave = useCallback(
    (note: Note) => {
      if (!isLoggedIn || readOnly) return
      if (debounceRef.current) clearTimeout(debounceRef.current)
      debounceRef.current = setTimeout(() => persistNote(note), 2000)
    },
    [isLoggedIn, readOnly, persistNote],
  )

  const handleFieldChange = (field: NoteField, value: string) => {
    if (readOnly) return
    setCurrentNote((prev) => {
      const updated = { ...prev, [field]: value }
      scheduleAutoSave(updated)
      return updated
    })
  }

  const handleSave = () => {
    if (!isLoggedIn) {
      alert('You need to sign up to use this feature.')
      openAuthModal('signup')
      return
    }
    if (debounceRef.current) clearTimeout(debounceRef.current)
    persistNote(currentNoteRef.current)
  }

  const handleToggleChapter = async (chapterId: string) => {
    if (expandedChapterIds.has(chapterId)) {
      setExpandedChapterIds((prev) => {
        const next = new Set(prev)
        next.delete(chapterId)
        return next
      })
      return
    }
    setExpandedChapterIds((prev) => new Set(prev).add(chapterId))
    if (!notesByChapter[chapterId]) {
      await loadNotesForChapter(chapterId)
    }
  }

  const handleCreateChapter = async (name: string) => {
    if (!userId) return
    const { data, error } = await createChapter(userId, name)
    if (error) {
      setSaveMessage(error)
      return
    }
    if (data) {
      setChapters((prev) =>
        [...prev, data].sort((a, b) => a.name.localeCompare(b.name, 'ko')),
      )
      setExpandedChapterIds((prev) => new Set(prev).add(data.id))
      setNotesByChapter((prev) => ({ ...prev, [data.id]: [] }))
    }
  }

  const handleCreateNote = (chapterId: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    const note = createEmptyNote(chapterId, userId)
    setCurrentNote(note)
    setSaveStatus('idle')
    setSaveMessage(null)
  }

  const handleSelectNote = (note: Note) => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    setCurrentNote(note)
    setSaveStatus('idle')
    setSaveMessage(null)
  }

  const handleLogout = async () => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    await logout()
    setCurrentNote(createEmptyNote())
    setSaveStatus('idle')
    setSaveMessage(null)
  }

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [])

  useEffect(() => {
    const clearPrint = () => setPrintQueue(null)
    window.addEventListener('afterprint', clearPrint)
    return () => window.removeEventListener('afterprint', clearPrint)
  }, [])

  const syncContactVisibility = useCallback(() => {
    const scroll = noteScrollRef.current
    if (!scroll) return
    const remaining =
      scroll.scrollHeight - scroll.scrollTop - scroll.clientHeight
    setShowContact(remaining <= 80)
  }, [])

  useEffect(() => {
    const scroll = noteScrollRef.current
    if (!scroll) return

    syncContactVisibility()
    scroll.addEventListener('scroll', syncContactVisibility, { passive: true })
    window.addEventListener('resize', syncContactVisibility)

    const ro = new ResizeObserver(syncContactVisibility)
    ro.observe(scroll)
    const pad = scroll.querySelector('.a4-pad-wrapper')
    if (pad) ro.observe(pad)

    return () => {
      ro.disconnect()
      scroll.removeEventListener('scroll', syncContactVisibility)
      window.removeEventListener('resize', syncContactVisibility)
    }
  }, [currentNote.id, syncContactVisibility])

  const buildChapterPrintNotes = useCallback(
    async (chapterId: string): Promise<Note[]> => {
      let list = notesByChapter[chapterId] ?? []
      if (list.length === 0 && userId) {
        const { data, error } = await fetchNotesByChapter(chapterId, userId)
        if (error) {
          setSaveMessage(error)
          return [currentNoteRef.current]
        }
        list = data
        setNotesByChapter((prev) => ({ ...prev, [chapterId]: data }))
      }

      const current = currentNoteRef.current
      const merged = list.map((n) =>
        n.id === current.id ? { ...n, ...current } : n,
      )
      const inList = merged.some((n) => n.id === current.id)
      if (current.chapter_id === chapterId && !inList) {
        return [...merged, current]
      }
      return merged.length > 0 ? merged : [current]
    },
    [notesByChapter, userId],
  )

  const handlePrint = useCallback(async () => {
    if (debounceRef.current) clearTimeout(debounceRef.current)

    const current = currentNoteRef.current
    let queue: Note[] = [current]

    if (isLoggedIn && current.chapter_id && userId) {
      queue = await buildChapterPrintNotes(current.chapter_id)
      if (queue.length === 0) {
        alert('There are no notes to export in this chapter.')
        return
      }
    }

    setPrintQueue(queue)
    requestAnimationFrame(() => {
      requestAnimationFrame(() => window.print())
    })
  }, [isLoggedIn, userId, buildChapterPrintNotes])

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-100 text-sm text-slate-500">
        Loading…
      </div>
    )
  }

  return (
    <div className="flex h-screen flex-col bg-slate-100">
      <TopBar
        saveStatus={saveStatus}
        saveMessage={saveMessage}
        isLoggedIn={isLoggedIn}
        email={email}
        onSave={handleSave}
        onPrint={handlePrint}
        onLoginClick={() => openAuthModal('login')}
        onSignUpClick={() => openAuthModal('signup')}
        onLogout={handleLogout}
      />

      <LoginModal
        open={authOpen || needsPasswordReset}
        initialTab={authTab}
        forceResetView={needsPasswordReset}
        onClose={() => setAuthOpen(false)}
        onDismissRecovery={dismissPasswordRecovery}
        onSignIn={signIn}
        onSignUp={signUp}
        onRequestPasswordReset={requestPasswordResetEmail}
        onUpdatePassword={updatePassword}
      />

      <div className="flex min-h-0 flex-1">
        <NoteSidebar
          isLoggedIn={isLoggedIn}
          chapters={chapters}
          notesByChapter={notesByChapter}
          expandedChapterIds={expandedChapterIds}
          activeNoteId={currentNote.id}
          loadingChapterId={loadingChapterId}
          onToggleChapter={handleToggleChapter}
          onCreateChapter={handleCreateChapter}
          onCreateNote={handleCreateNote}
          onSelectNote={handleSelectNote}
        />

        <div className="screen-only flex min-h-0 min-w-0 flex-1 flex-col">
          <div
            ref={noteScrollRef}
            onScroll={syncContactVisibility}
            className="note-scroll-panel flex flex-1 flex-col items-center overflow-y-auto px-4 pb-6 pt-6"
          >
            <div className="a4-pad-wrapper">
              <NoteEditor
                key={`${currentNote.id}-${readOnly}`}
                note={currentNote}
                readOnly={readOnly}
                onFieldChange={handleFieldChange}
              />
            </div>
            <div className="note-pad-scroll-spacer" aria-hidden />
          </div>
          {showContact && <ContactLink />}
        </div>
      </div>

      {printQueue && printQueue.length > 0 && (
        <ChapterPrintView notes={printQueue} />
      )}
    </div>
  )
}
