import { useState } from 'react'
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
  onCreateNote: (chapterId: string) => void
  onSelectNote: (note: Note) => void
}

function displayTitle(note: Note): string {
  return note.main_title?.trim() || '제목 없음'
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
  onCreateNote,
  onSelectNote,
}: NoteSidebarProps) {
  const [newChapterName, setNewChapterName] = useState('')
  const [showChapterInput, setShowChapterInput] = useState(false)

  if (!isLoggedIn) {
    return (
      <aside className="print:hidden flex w-56 shrink-0 flex-col border-r border-slate-200 bg-slate-50 p-4">
        <p className="text-xs leading-relaxed text-slate-500">
          로그인 후 저장 및 챕터 관리 기능을 이용할 수 있습니다.
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

  return (
    <aside className="print:hidden flex w-56 shrink-0 flex-col border-r border-slate-200 bg-slate-50">
      <nav className="flex-1 overflow-y-auto p-2">
        {chapters.length === 0 ? (
          <p className="px-2 py-4 text-center text-[10px] text-slate-400">
            Add Chapter로 챕터를 추가해 주세요
          </p>
        ) : (
          <ul className="space-y-1">
            {chapters.map((chapter) => {
              const isOpen = expandedChapterIds.has(chapter.id)
              const notes = notesByChapter[chapter.id] ?? []
              const isLoading = loadingChapterId === chapter.id

              return (
                <li key={chapter.id} className="rounded-md">
                  <div className="flex items-center gap-1 rounded-md px-1 py-1 transition hover:bg-white/80">
                    <button
                      type="button"
                      onClick={() => onToggleChapter(chapter.id)}
                      className="flex min-w-0 flex-1 items-center gap-1 py-1.5 text-left"
                    >
                      <span
                        className={`shrink-0 text-[10px] text-slate-400 transition ${
                          isOpen ? 'rotate-90' : ''
                        }`}
                      >
                        ▶
                      </span>
                      <span className="truncate text-xs font-medium text-slate-700">
                        {chapter.name}
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => onCreateNote(chapter.id)}
                      className="shrink-0 rounded px-1.5 py-1 text-[10px] text-slate-500 transition hover:bg-white hover:text-slate-800"
                    >
                      Add Note
                    </button>
                  </div>

                  {isOpen && (
                    <div className="ml-3 border-l border-slate-200 pl-2 pb-2">
                      {isLoading ? (
                        <p className="px-2 py-1 text-[10px] text-slate-400">
                          불러오는 중…
                        </p>
                      ) : notes.length === 0 ? (
                        <p className="px-2 py-1 text-[10px] text-slate-400">
                          노트 없음
                        </p>
                      ) : (
                        <ul className="space-y-0.5">
                          {notes.map((note) => (
                            <li key={note.id}>
                              <button
                                type="button"
                                onClick={() => onSelectNote(note)}
                                className={`w-full truncate rounded-md px-2 py-1.5 text-left text-[10px] transition ${
                                  note.id === activeNoteId
                                    ? 'bg-white font-medium text-slate-900 shadow-sm'
                                    : 'text-slate-600 hover:bg-white/70'
                                }`}
                              >
                                {displayTitle(note)}
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
              placeholder="챕터 이름"
              className="w-full rounded-md border border-slate-300 px-2 py-1.5 text-xs outline-none focus:border-slate-500"
              onKeyDown={(e) => e.key === 'Enter' && handleAddChapter()}
            />
            <div className="flex gap-1">
              <button
                type="button"
                onClick={handleAddChapter}
                className="flex-1 rounded-md bg-slate-800 py-1.5 text-xs text-white hover:bg-slate-700"
              >
                추가
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowChapterInput(false)
                  setNewChapterName('')
                }}
                className="rounded-md px-2 py-1.5 text-xs text-slate-500 hover:bg-white"
              >
                취소
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setShowChapterInput(true)}
            className="w-full rounded-md border border-dashed border-slate-300 py-2 text-[10px] text-slate-600 transition hover:border-slate-400 hover:bg-white"
          >
            Add Chapter
          </button>
        )}
      </div>
    </aside>
  )
}
