import { useCallback, useEffect, useRef, useState } from 'react'
import ChapterPrintView from './components/ChapterPrintView'
import ContactLink from './components/ContactLink'
import LoginModal, { type AuthModalTab } from './components/LoginModal'
import NoteEditor from './components/NoteEditor'
import NoteSidebar from './components/NoteSidebar'
import TopBar from './components/TopBar'
import { useAuth } from './context/AuthContext'
import {
  createChapter,
  fetchChapters,
  sortChaptersByName,
  updateChapter,
} from './services/chapterService'
import {
  deleteNote,
  fetchNotesByChapter,
  upsertNote,
} from './services/noteService'
import {
  createEmptyNote,
  createEmptyPageContent,
  getNotePageCount,
  isNoteEditable,
  isNoteEffectivelyEmpty,
  normalizeNote,
  type Note,
  type NoteField,
  type NotePageField,
} from './types/note'
import type { Chapter } from './types/chapter'
import { isNotePageEmpty } from './utils/notePages'

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
    authCallbackError,
    requestPasswordResetEmail,
    updatePassword,
    dismissPasswordRecovery,
    dismissAuthCallbackError,
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
    if (needsPasswordReset || authCallbackError) {
      setAuthOpen(true)
    }
  }, [needsPasswordReset, authCallbackError])

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
      if (!isLoggedIn || readOnly || !note.chapter_id) return
      if (debounceRef.current) clearTimeout(debounceRef.current)
      debounceRef.current = setTimeout(() => persistNote(note), 2000)
    },
    [isLoggedIn, readOnly, persistNote],
  )

  const handlePageFieldChange = (
    pageIndex: number,
    field: NoteField | NotePageField,
    value: string,
  ) => {
    if (readOnly) return
    setCurrentNote((prev) => {
      let updated: Note
      if (pageIndex === 0) {
        updated = { ...prev, [field]: value }
      } else {
        const pages = [...(prev.extra_pages ?? [])]
        while (pages.length < pageIndex) {
          pages.push(createEmptyPageContent())
        }
        const page = { ...pages[pageIndex - 1], [field]: value }
        pages[pageIndex - 1] = page
        updated = { ...prev, extra_pages: pages }
      }
      scheduleAutoSave(updated)
      return updated
    })
  }

  const handleAddPage = () => {
    if (readOnly) return
    if (!currentNoteRef.current.chapter_id) {
      alert(
        'Select a note from a chapter first. Use "Add Note" in the sidebar, or create a chapter.',
      )
      return
    }
    setCurrentNote((prev) => {
      const updated: Note = {
        ...prev,
        extra_pages: [...(prev.extra_pages ?? []), createEmptyPageContent()],
      }
      scheduleAutoSave(updated)
      return updated
    })
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        noteScrollRef.current?.scrollTo({
          top: noteScrollRef.current.scrollHeight,
          behavior: 'smooth',
        })
      })
    })
  }

  const handleRemovePage = (pageIndex: number) => {
    if (readOnly || pageIndex <= 0) return

    const extraIndex = pageIndex - 1
    const page = currentNoteRef.current.extra_pages?.[extraIndex]
    if (page && !isNotePageEmpty(page)) {
      const confirmed = window.confirm(
        'Delete this page? Its content cannot be recovered.',
      )
      if (!confirmed) return
    }

    setCurrentNote((prev) => {
      const pages = [...(prev.extra_pages ?? [])]
      pages.splice(extraIndex, 1)
      const updated: Note = { ...prev, extra_pages: pages }
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
    if (!currentNoteRef.current.chapter_id) {
      setSaveStatus('error')
      setSaveMessage(
        'Create or select a note from a chapter in the sidebar before saving.',
      )
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
      setChapters((prev) => sortChaptersByName([...prev, data]))
      setExpandedChapterIds((prev) => new Set(prev).add(data.id))
      const note = createEmptyNote(data.id, userId)
      setNotesByChapter((prev) => ({ ...prev, [data.id]: [note] }))
      setCurrentNote(note)
      setSaveStatus('idle')
      setSaveMessage(null)
    }
  }

  const handleUpdateChapter = async (chapterId: string, name: string) => {
    if (!userId) return
    const { data, error } = await updateChapter(chapterId, userId, name)
    if (error) {
      setSaveMessage(error)
      return
    }
    if (data) {
      setChapters((prev) =>
        sortChaptersByName(prev.map((c) => (c.id === data.id ? data : c))),
      )
      setSaveMessage(null)
    }
  }

  const handleCreateNote = (chapterId: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    const note = createEmptyNote(chapterId, userId)
    setCurrentNote(note)
    setNotesByChapter((prev) => ({
      ...prev,
      [chapterId]: [...(prev[chapterId] ?? []), note],
    }))
    setSaveStatus('idle')
    setSaveMessage(null)
    noteScrollRef.current?.scrollTo({ top: 0 })
  }

  const handleSelectNote = (note: Note) => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    setCurrentNote(normalizeNote(note))
    setSaveStatus('idle')
    setSaveMessage(null)
    noteScrollRef.current?.scrollTo({ top: 0 })
  }

  const handleDeleteNote = async (note: Note) => {
    if (!userId || !note.chapter_id) return

    if (
      !isNoteEffectivelyEmpty(note) &&
      !window.confirm('Delete this note? This cannot be undone.')
    ) {
      return
    }

    if (debounceRef.current) clearTimeout(debounceRef.current)

    const { error } = await deleteNote(note.id, userId)
    if (error) {
      setSaveMessage(error)
      return
    }

    const chapterId = note.chapter_id
    const remaining = (notesByChapter[chapterId] ?? []).filter(
      (n) => n.id !== note.id,
    )
    setNotesByChapter((prev) => ({ ...prev, [chapterId]: remaining }))

    if (currentNoteRef.current.id !== note.id) return

    if (remaining.length > 0) {
      setCurrentNote(normalizeNote(remaining[0]))
    } else {
      setCurrentNote(createEmptyNote(chapterId, userId))
    }
    setSaveStatus('idle')
    setSaveMessage(null)
    noteScrollRef.current?.scrollTo({ top: 0 })
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
    scroll.querySelectorAll('.a4-pad-wrapper').forEach((pad) => ro.observe(pad))

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

  const pageCount = getNotePageCount(currentNote)

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
        open={authOpen || needsPasswordReset || !!authCallbackError}
        initialTab={authTab}
        forceResetView={needsPasswordReset}
        forceForgotView={!!authCallbackError}
        initialError={authCallbackError}
        onClose={() => setAuthOpen(false)}
        onDismissRecovery={dismissPasswordRecovery}
        onDismissCallbackError={dismissAuthCallbackError}
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
          onUpdateChapter={handleUpdateChapter}
          onCreateNote={handleCreateNote}
          onSelectNote={handleSelectNote}
          onDeleteNote={handleDeleteNote}
        />

        <div className="screen-only flex min-h-0 min-w-0 flex-1 flex-col">
          <div
            ref={noteScrollRef}
            onScroll={syncContactVisibility}
            className="note-scroll-panel flex flex-1 flex-col items-center overflow-y-auto overflow-x-hidden px-4 pb-6 pt-6"
          >
            {Array.from({ length: pageCount }, (_, pageIndex) => (
              <div
                key={`${currentNote.id}-page-${pageIndex}`}
                className={`a4-pad-wrapper ${pageIndex > 0 ? 'note-page-stack-item' : ''}`}
              >
                <NoteEditor
                  note={currentNote}
                  readOnly={readOnly}
                  pageIndex={pageIndex}
                  totalPages={pageCount}
                  onFieldChange={handlePageFieldChange}
                  onRemovePage={
                    pageIndex > 0 && !readOnly
                      ? () => handleRemovePage(pageIndex)
                      : undefined
                  }
                />
              </div>
            ))}
            {!readOnly && (
              <div className="note-add-page-wrap">
                <button
                  type="button"
                  onClick={handleAddPage}
                  className="note-add-page-btn"
                >
                  + Add page
                </button>
              </div>
            )}
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
