import type { Note } from '../types/note'

export interface PrintSheet {
  note: Note
  pageNumber: number
  continuationLayout: boolean
}

/** Expand a note with extra_pages into individual print sheets. */
export function expandNoteToPrintPages(note: Note): PrintSheet[] {
  const sheets: PrintSheet[] = [{ note, pageNumber: 1, continuationLayout: false }]
  const extras = note.extra_pages ?? []

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
      continuationLayout: true,
    })
  }

  return sheets
}

export function expandNotesToPrintPages(notes: Note[]): PrintSheet[] {
  return notes.flatMap(expandNoteToPrintPages)
}
