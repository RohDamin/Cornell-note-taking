import { useCallback, useEffect, useRef, useState } from 'react'
import ChapterPrintView from './components/ChapterPrintView'
import LoginModal from './components/LoginModal'
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
  const { username, isLoggedIn, login, logout } = useAuth()

  const [loginOpen, setLoginOpen] = useState(false)
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

  useEffect(() => {
    currentNoteRef.current = currentNote
  }, [currentNote])

  const readOnly = !isNoteEditable(currentNote, username)

  const loadChapters = useCallback(async () => {
    if (!username) return
    const { data, error } = await fetchChapters(username)
    if (error) {
      setSaveMessage(error)
      return
    }
    setChapters(data)
  }, [username])

  const loadNotesForChapter = useCallback(
    async (chapterId: string) => {
      if (!username) return
      setLoadingChapterId(chapterId)
      const { data, error } = await fetchNotesByChapter(chapterId, username)
      setLoadingChapterId(null)
      if (error) {
        setSaveMessage(error)
        return
      }
      setNotesByChapter((prev) => ({ ...prev, [chapterId]: data }))
    },
    [username],
  )

  useEffect(() => {
    if (isLoggedIn && username) {
      loadChapters()
    } else {
      setChapters([])
      setNotesByChapter({})
      setExpandedChapterIds(new Set())
    }
  }, [isLoggedIn, username, loadChapters])

  const persistNote = useCallback(
    async (note: Note) => {
      if (!isLoggedIn || !username) return

      if (!isNoteEditable(note, username)) {
        setSaveStatus('error')
        setSaveMessage('수정 권한이 없는 노트입니다.')
        return
      }

      if (!note.chapter_id) {
        setSaveStatus('error')
        setSaveMessage('챕터에 속한 노트만 저장할 수 있습니다.')
        return
      }

      const toSave: Note = { ...note, username }

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
    [isLoggedIn, username],
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
      alert('회원가입 해야 이용 가능한 기능입니다.')
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
    if (!username) return
    const { data, error } = await createChapter(username, name)
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
    const note = createEmptyNote(chapterId, username)
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

  const handleLogout = () => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    logout()
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

  const buildChapterPrintNotes = useCallback(
    async (chapterId: string): Promise<Note[]> => {
      let list = notesByChapter[chapterId] ?? []
      if (list.length === 0 && username) {
        const { data, error } = await fetchNotesByChapter(chapterId, username)
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
    [notesByChapter, username],
  )

  const handlePrint = useCallback(async () => {
    if (debounceRef.current) clearTimeout(debounceRef.current)

    const current = currentNoteRef.current
    let queue: Note[] = [current]

    if (isLoggedIn && current.chapter_id && username) {
      queue = await buildChapterPrintNotes(current.chapter_id)
      if (queue.length === 0) {
        alert('이 챕터에 출력할 노트가 없습니다.')
        return
      }
    }

    setPrintQueue(queue)
    requestAnimationFrame(() => {
      requestAnimationFrame(() => window.print())
    })
  }, [isLoggedIn, username, buildChapterPrintNotes])

  return (
    <div className="flex h-screen flex-col bg-slate-100">
      <TopBar
        saveStatus={saveStatus}
        saveMessage={saveMessage}
        isLoggedIn={isLoggedIn}
        username={username}
        onSave={handleSave}
        onPrint={handlePrint}
        onLoginClick={() => setLoginOpen(true)}
        onLogout={handleLogout}
      />

      <LoginModal
        open={loginOpen}
        onClose={() => setLoginOpen(false)}
        onLogin={login}
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

        <main className="screen-only flex flex-1 items-start justify-center overflow-y-auto p-6">
          <div className="a4-pad-wrapper">
            <NoteEditor
              key={`${currentNote.id}-${readOnly}`}
              note={currentNote}
              readOnly={readOnly}
              onFieldChange={handleFieldChange}
            />
          </div>
        </main>
      </div>

      {printQueue && printQueue.length > 0 && (
        <ChapterPrintView notes={printQueue} />
      )}
    </div>
  )
}
