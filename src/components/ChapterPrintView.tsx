import NoteEditor from './NoteEditor'
import type { Note } from '../types/note'

interface ChapterPrintViewProps {
  notes: Note[]
}

/** 인쇄/PDF 전용 — 챕터 노트를 순서대로 한 장씩 출력 */
export default function ChapterPrintView({ notes }: ChapterPrintViewProps) {
  return (
    <div id="chapter-print-root" className="chapter-print-root">
      {notes.map((note, index) => (
        <div
          key={note.id}
          className={`print-note-sheet ${index < notes.length - 1 ? 'print-note-sheet--break' : ''}`}
        >
          <div className="a4-pad-wrapper">
            <NoteEditor
              note={note}
              readOnly
              forPrint
              onFieldChange={() => {}}
            />
          </div>
        </div>
      ))}
    </div>
  )
}
