export interface Note {
  id: string
  chapter_id: string | null
  username: string | null
  main_title: string | null
  sub_title: string | null
  keyword_content: string | null
  notes_content: string | null
  summary_content: string | null
}

export type NoteField = keyof Omit<
  Note,
  'id' | 'chapter_id' | 'username'
>

export function createEmptyNote(
  chapterId: string | null = null,
  username: string | null = null,
): Note {
  return {
    id: crypto.randomUUID(),
    chapter_id: chapterId,
    username,
    main_title: '',
    sub_title: '',
    keyword_content: '',
    notes_content: '',
    summary_content: '',
  }
}

export function isNoteEditable(
  note: Note,
  currentUsername: string | null,
): boolean {
  if (!currentUsername) return true
  if (!note.username) return true
  return note.username === currentUsername
}
