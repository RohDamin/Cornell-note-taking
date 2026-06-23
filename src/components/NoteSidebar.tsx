import { useState } from 'react'
import { Pencil } from 'lucide-react'
import type { Chapter } from '../types/chapter'
import type { Note } from '../types/note'

interface NoteSidebarProps {
  isLoggedIn: boolean
  chapters: Chapter[]
  notesByChapter: Record<string, Note[]>
  expandedChapterIds: Set<string>
  activeNoteId: string | null
  loadingChapterId: string | null
  onToggleChapter: (chapterId: string) => void
  onCreateChapter: (name: string) => void
  onUpdateChapter: (chapterId: string, name: string) => void
  onCreateNote: (chapterId: string) => void
  onSelectNote: (note: Note) => void
  onDeleteNote: (note: Note) => void
}

function displayTitle(note: Note): string {
  return note.main_title?.trim() || 'Untitled'
}

export default function NoteSidebar({
  isLoggedIn,
  chapters,
  notesByChapter,
  expandedChapterIds,
  activeNoteId,
  loadingChapterId,
  onToggleChapter,
  onCreateChapter,
  onUpdateChapter,
  onCreateNote,
  onSelectNote,
  onDeleteNote,
}: NoteSidebarProps) {
  const [newChapterName, setNewChapterName] = useState('')
  const [showChapterInput, setShowChapterInput] = useState(false)
  const [editingChapterId, setEditingChapterId] = useState<string | null>(null)
  const [editChapterName, setEditChapterName] = useState('')

  if (!isLoggedIn) {
    return (
      <aside className="print:hidden flex w-56 shrink-0 flex-col border-r border-slate-200 bg-slate-50 p-4">
        <p className="text-[17px] leading-relaxed text-slate-500">
          Sign in to save notes and manage chapters.
        </p>
      </aside>
    )
  }

  const handleAddChapter = () => {
    const name = newChapterName.trim()
    if (!name) return
    onCreateChapter(name)
    setNewChapterName('')
    setShowChapterInput(false)
  }

  const startEditingChapter = (chapterId: string, name: string) => {
    setEditingChapterId(chapterId)
    setEditChapterName(name)
  }

  const cancelEditingChapter = () => {
    setEditingChapterId(null)
    setEditChapterName('')
  }

  const saveEditingChapter = () => {
    if (!editingChapterId) return
    const name = editChapterName.trim()
    if (!name) {
      cancelEditingChapter()
      return
    }
    onUpdateChapter(editingChapterId, name)
    cancelEditingChapter()
  }

  return (
    <aside className="print:hidden flex w-56 shrink-0 flex-col border-r border-slate-200 bg-slate-50">
      <nav className="flex-1 overflow-y-auto p-2">
        {chapters.length === 0 ? (
          <p className="px-2 py-4 text-center text-[15px] text-slate-400">
            Use Add Chapter below to create one.
          </p>
        ) : (
          <ul className="space-y-1">
            {chapters.map((chapter) => {
              const isOpen = expandedChapterIds.has(chapter.id)
              const notes = notesByChapter[chapter.id] ?? []
              const isLoading = loadingChapterId === chapter.id

              return (
                <li key={chapter.id} className="group rounded-md">
                  <div className="flex items-center gap-1 rounded-md px-1 py-1 transition hover:bg-white/80">
                    <button
                      type="button"
                      onClick={() => onToggleChapter(chapter.id)}
                      className="flex shrink-0 items-center py-1.5 text-left"
                    >
                      <span
                        className={`shrink-0 text-[15px] text-slate-400 transition ${
                          isOpen ? 'rotate-90' : ''
                        }`}
                      >
                        ▶
                      </span>
                    </button>
                    {editingChapterId === chapter.id ? (
                      <input
                        type="text"
                        value={editChapterName}
                        onChange={(e) => setEditChapterName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') saveEditingChapter()
                          if (e.key === 'Escape') cancelEditingChapter()
                        }}
                        onBlur={saveEditingChapter}
                        autoFocus
                        className="min-w-0 flex-1 rounded-md border border-slate-300 px-1.5 py-0.5 text-[17px] font-medium text-slate-700 outline-none focus:border-slate-500"
                      />
                    ) : (
                      <div className="relative min-w-0 flex-1">
                        <button
                          type="button"
                          onClick={() => onToggleChapter(chapter.id)}
                          onDoubleClick={() =>
                            startEditingChapter(chapter.id, chapter.name)
                          }
                          className="w-full py-1.5 pr-0 text-left text-[17px] font-medium text-slate-700 group-hover:pr-6"
                        >
                          <span className="block truncate">{chapter.name}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            startEditingChapter(chapter.id, chapter.name)
                          }
                          className="absolute right-0 top-1/2 hidden -translate-y-1/2 rounded p-1 text-slate-400 group-hover:flex hover:bg-white hover:text-slate-700"
                          aria-label={`Rename ${chapter.name}`}
                          title="Rename chapter"
                        >
                          <Pencil size={14} strokeWidth={2} aria-hidden />
                        </button>
                      </div>
                    )}
                    {isOpen && (
                      <button
                        type="button"
                        onClick={() => onCreateNote(chapter.id)}
                        className="shrink-0 rounded px-1.5 py-1 text-[15px] text-slate-500 transition hover:bg-white hover:text-slate-800"
                      >
                        Add Note
                      </button>
                    )}
                  </div>

                  {isOpen && (
                    <div className="ml-3 border-l border-slate-200 pl-2 pb-2">
                      {isLoading ? (
                        <p className="px-2 py-1 text-[15px] text-slate-400">
                          Loading…
                        </p>
                      ) : notes.length === 0 ? (
                        <p className="px-2 py-1 text-[15px] text-slate-400">
                          No notes
                        </p>
                      ) : (
                        <ul className="space-y-0.5">
                          {notes.map((note) => (
                            <li key={note.id} className="group flex items-center gap-0.5">
                              <button
                                type="button"
                                onClick={() => onSelectNote(note)}
                                className={`min-w-0 flex-1 truncate rounded-md px-2 py-1.5 text-left text-[15px] transition ${
                                  note.id === activeNoteId
                                    ? 'bg-white font-medium text-slate-900 shadow-sm'
                                    : 'text-slate-600 hover:bg-white/70'
                                }`}
                              >
                                {displayTitle(note)}
                              </button>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  onDeleteNote(note)
                                }}
                                className={`shrink-0 rounded px-1.5 py-1 text-[13px] text-slate-400 transition hover:bg-red-50 hover:text-red-600 ${
                                  note.id === activeNoteId
                                    ? 'opacity-100'
                                    : 'opacity-0 group-hover:opacity-100'
                                }`}
                                aria-label={`Delete ${displayTitle(note)}`}
                                title="Delete note"
                              >
                                ×
                              </button>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  )}
                </li>
              )
            })}
          </ul>
        )}
      </nav>

      <div className="shrink-0 border-t border-slate-200 p-3">
        {showChapterInput ? (
          <div className="space-y-2">
            <input
              type="text"
              value={newChapterName}
              onChange={(e) => setNewChapterName(e.target.value)}
              placeholder="Chapter name"
              className="w-full rounded-md border border-slate-300 px-2 py-1.5 text-[17px] outline-none focus:border-slate-500"
              onKeyDown={(e) => e.key === 'Enter' && handleAddChapter()}
            />
            <div className="flex gap-1">
              <button
                type="button"
                onClick={handleAddChapter}
                className="flex-1 rounded-md bg-slate-800 py-1.5 text-[17px] text-white hover:bg-slate-700"
              >
                Add
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowChapterInput(false)
                  setNewChapterName('')
                }}
                className="rounded-md px-2 py-1.5 text-[17px] text-slate-500 hover:bg-white"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setShowChapterInput(true)}
            className="w-full rounded-md border border-dashed border-slate-300 py-2 text-[15px] text-slate-600 transition hover:border-slate-400 hover:bg-white"
          >
            Add Chapter
          </button>
        )}
      </div>
    </aside>
  )
}
