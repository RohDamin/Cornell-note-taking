import type { Note, NotePageContent } from '../types/note'
import { isNotesContentEmpty } from './notesContent'

export function isNotePageEmpty(page: NotePageContent): boolean {
  return (
    !page.keyword_content?.trim() &&
    isNotesContentEmpty(page.notes_content ?? '') &&
    !page.summary_content?.trim()
  )
}

export interface PrintSheet {
  note: Note
  pageNumber: number
  totalPages: number
  continuationLayout: boolean
}

/** Expand a note with extra_pages into individual print sheets. */
export function expandNoteToPrintPages(note: Note): PrintSheet[] {
  const extras = note.extra_pages ?? []
  const totalPages = 1 + extras.length
  const sheets: PrintSheet[] = [
    { note, pageNumber: 1, totalPages, continuationLayout: false },
  ]

  for (let i = 0; i < extras.length; i++) {
    sheets.push({
      note: {
        ...note,
        id: `${note.id}-page-${i + 1}`,
        main_title: null,
        sub_title: null,
        keyword_content: extras[i].keyword_content,
        notes_content: extras[i].notes_content,
        summary_content: extras[i].summary_content,
        extra_pages: [],
      },
      pageNumber: i + 2,
      totalPages,
      continuationLayout: true,
    })
  }

  return sheets
}

export function expandNotesToPrintPages(notes: Note[]): PrintSheet[] {
  return notes.flatMap(expandNoteToPrintPages)
}
