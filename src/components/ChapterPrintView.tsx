import NoteEditor from './NoteEditor'
import type { Note } from '../types/note'
import { expandNotesToPrintPages } from '../utils/notePages'

interface ChapterPrintViewProps {
  notes: Note[]
}

/** 인쇄/PDF 전용 — 챕터 노트를 순서대로 한 장씩 출력 */
export default function ChapterPrintView({ notes }: ChapterPrintViewProps) {
  const sheets = expandNotesToPrintPages(notes)

  return (
    <div id="chapter-print-root" className="chapter-print-root">
      {sheets.map(({ note, pageNumber, continuationLayout }, index) => (
        <div
          key={note.id}
          className={`print-note-sheet ${index < sheets.length - 1 ? 'print-note-sheet--break' : ''}`}
        >
          <div className="a4-pad-wrapper">
            <NoteEditor
              note={note}
              readOnly
              forPrint
              continuationLayout={continuationLayout}
              pageNumber={pageNumber}
              onFieldChange={() => {}}
            />
          </div>
        </div>
      ))}
    </div>
  )
}
