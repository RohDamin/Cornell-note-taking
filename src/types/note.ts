import { isNotesContentEmpty } from '../utils/notesContent'

export interface NotePageContent {
  keyword_content: string | null
  notes_content: string | null
  summary_content: string | null
}

export interface Note {
  id: string
  chapter_id: string | null
  user_id: string | null
  created_at: string | null
  main_title: string | null
  sub_title: string | null
  keyword_content: string | null
  notes_content: string | null
  summary_content: string | null
  extra_pages: NotePageContent[] | null
}

export type NoteField = keyof Omit<
  Note,
  'id' | 'chapter_id' | 'user_id' | 'extra_pages' | 'created_at'
>

export type NotePageField = keyof NotePageContent

export function createEmptyNote(
  chapterId: string | null = null,
  userId: string | null = null,
): Note {
  return {
    id: crypto.randomUUID(),
    chapter_id: chapterId,
    user_id: userId,
    created_at: new Date().toISOString(),
    main_title: '',
    sub_title: '',
    keyword_content: '',
    notes_content: '',
    summary_content: '',
    extra_pages: [],
  }
}

export function createEmptyPageContent(): NotePageContent {
  return {
    keyword_content: '',
    notes_content: '',
    summary_content: '',
  }
}

export function getNotePageCount(note: Note): number {
  return 1 + (note.extra_pages?.length ?? 0)
}

export function normalizeNote(note: Note): Note {
  return {
    ...note,
    extra_pages: note.extra_pages ?? [],
  }
}

export function formatNoteCreatedAt(createdAt: string | null): string | null {
  if (!createdAt) return null
  const date = new Date(createdAt)
  if (Number.isNaN(date.getTime())) return null
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

export function isNoteEffectivelyEmpty(note: Note): boolean {
  if (note.main_title?.trim()) return false
  if (note.sub_title?.trim()) return false
  if (note.keyword_content?.trim()) return false
  if (note.summary_content?.trim()) return false
  if (!isNotesContentEmpty(note.notes_content ?? '')) return false
  const extras = note.extra_pages ?? []
  return !extras.some(
    (page) =>
      page.keyword_content?.trim() ||
      !isNotesContentEmpty(page.notes_content ?? '') ||
      page.summary_content?.trim(),
  )
}

export function isNoteEditable(
  note: Note,
  currentUserId: string | null,
): boolean {
  if (!currentUserId) return true
  if (!note.user_id) return true
  return note.user_id === currentUserId
}
