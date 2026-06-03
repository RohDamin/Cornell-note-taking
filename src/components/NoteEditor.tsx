import { useRef, useEffect, type KeyboardEvent } from 'react'
import NoteRulesLayer from './NoteRulesLayer'
import type { Note, NoteField } from '../types/note'
import {
  clampInnerTextToBox,
  fitsInBox,
  placeCaretAtEnd,
  clampTextareaValue,
} from '../utils/boundedText'
import {
  isNotesContentEmpty,
  sanitizeNotesHtml,
  setNotesEditorContent,
} from '../utils/notesContent'

interface NoteEditorProps {
  note: Note
  readOnly: boolean
  forPrint?: boolean
  onFieldChange: (field: NoteField, value: string) => void
}

function PlainEditable({
  value,
  onChange,
  placeholder,
  readOnly,
  syncKey,
  className = '',
  clampToBounds = false,
}: {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  readOnly: boolean
  syncKey: string
  className?: string
  clampToBounds?: boolean
}) {
  const ref = useRef<HTMLDivElement>(null)
  const lastGoodRef = useRef(value)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    let text = value
    if (clampToBounds && !readOnly) {
      text = clampInnerTextToBox(el, value)
      if (text !== value) onChange(text)
    } else {
      el.innerText = value
    }
    lastGoodRef.current = text
  }, [syncKey])

  const handleInput = (el: HTMLDivElement) => {
    if (readOnly) return
    const text = el.innerText
    if (clampToBounds && !fitsInBox(el)) {
      el.innerText = lastGoodRef.current
      placeCaretAtEnd(el)
      return
    }
    lastGoodRef.current = text
    onChange(text)
  }

  return (
    <div
      ref={ref}
      contentEditable={!readOnly}
      suppressContentEditableWarning
      role="textbox"
      aria-multiline
      aria-readonly={readOnly}
      data-placeholder={placeholder}
      onInput={(e) => handleInput(e.currentTarget)}
      className={`editable-field note-bounded-field outline-none ${readOnly ? 'cursor-default text-slate-600' : ''} ${className}`}
    />
  )
}

function BoundedSummaryField({
  value,
  onChange,
  placeholder,
  readOnly,
  syncKey,
}: {
  value: string
  onChange: (value: string) => void
  placeholder: string
  readOnly: boolean
  syncKey: string
}) {
  const ref = useRef<HTMLTextAreaElement>(null)
  const lastGoodRef = useRef(value)

  useEffect(() => {
    const el = ref.current
    if (!el || readOnly) {
      lastGoodRef.current = value
      return
    }
    const clamped = clampTextareaValue(el, value)
    lastGoodRef.current = clamped
    if (clamped !== value) onChange(clamped)
  }, [syncKey])

  const handleChange = (next: string) => {
    const el = ref.current
    if (!el || readOnly) return

    const clamped = clampTextareaValue(el, next)
    lastGoodRef.current = clamped
    if (clamped !== next) {
      el.value = clamped
    }
    onChange(clamped)
  }

  return (
    <textarea
      ref={ref}
      value={value}
      readOnly={readOnly}
      onChange={(e) => handleChange(e.target.value)}
      placeholder={placeholder}
      rows={5}
      className={`note-bounded-field note-summary-input h-[5.5rem] max-h-[5.5rem] w-full resize-none overflow-hidden border-0 bg-transparent text-xs leading-relaxed placeholder:text-slate-300 focus:outline-none focus:ring-0 ${readOnly ? 'cursor-default text-slate-600' : 'text-slate-800'}`}
    />
  )
}

function LinedNotesArea({
  value,
  onChange,
  placeholder,
  readOnly,
  syncKey,
  className = '',
}: {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  readOnly: boolean
  syncKey: string
  className?: string
}) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    setNotesEditorContent(el, value)
  }, [syncKey])

  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'b') {
      e.preventDefault()
      document.execCommand('bold')
      if (ref.current) {
        onChange(sanitizeNotesHtml(ref.current.innerHTML))
      }
    }
  }

  if (readOnly) {
    const empty = isNotesContentEmpty(value)
    return (
      <div className={`lined-notes-wrap min-h-0 ${className}`}>
        <NoteRulesLayer />
        {empty ? (
          <div className="lined-notes-input text-xs text-slate-300">
            {placeholder}
          </div>
        ) : value.includes('<') ? (
          <div
            className="lined-notes-input text-xs text-slate-600"
            dangerouslySetInnerHTML={{
              __html: sanitizeNotesHtml(value),
            }}
          />
        ) : (
          <div className="lined-notes-input whitespace-pre-wrap text-xs text-slate-600">
            {value}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className={`lined-notes-wrap min-h-0 ${className}`}>
      <NoteRulesLayer />
      <div
        ref={ref}
        contentEditable
        suppressContentEditableWarning
        role="textbox"
        aria-multiline
        data-placeholder={placeholder}
        onInput={(e) =>
          onChange(sanitizeNotesHtml(e.currentTarget.innerHTML))
        }
        onKeyDown={handleKeyDown}
        className="lined-notes-input editable-field min-h-full w-full flex-1 text-xs text-slate-800 outline-none"
      />
    </div>
  )
}

export default function NoteEditor({
  note,
  readOnly,
  forPrint = false,
  onFieldChange,
}: NoteEditorProps) {
  const mainTitle = note.main_title ?? ''
  const subTitle = note.sub_title ?? ''
  const keywords = note.keyword_content ?? ''
  const body = note.notes_content ?? ''
  const summary = note.summary_content ?? ''

  const titleClass = readOnly ? 'cursor-default text-slate-600' : 'text-slate-900'

  return (
    <article
      id={forPrint ? undefined : 'note-pad'}
      className={`note-pad a4-pad mx-auto flex flex-col bg-white shadow-xl ${readOnly && !forPrint ? 'opacity-95' : ''}`}
    >
      {readOnly && !forPrint && (
        <div className="note-pad-inset shrink-0 bg-amber-50 py-1.5 text-center text-[10px] text-amber-700">
          Read-only — you cannot edit this note
        </div>
      )}

      <input
        type="text"
        value={mainTitle}
        readOnly={readOnly}
        onChange={(e) => onFieldChange('main_title', e.target.value)}
        placeholder="01. Enter a title"
        className={`note-pad-inset shrink-0 border-0 bg-transparent pt-8 text-2xl font-bold tracking-tight placeholder:text-slate-300 focus:outline-none focus:ring-0 ${titleClass}`}
      />

      <input
        type="text"
        value={subTitle}
        readOnly={readOnly}
        onChange={(e) => onFieldChange('sub_title', e.target.value)}
        placeholder="Enter a subtitle"
        className={`note-pad-inset mt-4 shrink-0 border-0 bg-transparent pb-4 text-base font-bold placeholder:text-slate-300 focus:outline-none focus:ring-0 ${readOnly ? 'text-slate-600' : 'text-slate-600'}`}
      />

      <div className="note-body-section flex min-h-0 flex-1 border-t border-slate-200">
        <section className="note-keyword-column note-pad-inset flex w-[25%] min-h-0 flex-col overflow-hidden border-r border-slate-200 py-3">
          {readOnly ? (
            <div className="note-bounded-field min-h-0 flex-1 overflow-hidden whitespace-pre-wrap text-xs leading-relaxed text-slate-600">
              {keywords || <span className="text-slate-300">Keywords</span>}
            </div>
          ) : (
            <PlainEditable
              value={keywords}
              onChange={(v) => onFieldChange('keyword_content', v)}
              placeholder="Keywords"
              readOnly={false}
              syncKey={note.id}
              clampToBounds
              className="min-h-0 flex-1 text-xs leading-relaxed text-slate-800"
            />
          )}
        </section>

        <section className="note-pad-inset-right notes-column flex min-h-0 w-[75%] flex-col overflow-hidden py-3">
          <LinedNotesArea
            value={body}
            onChange={(v) => onFieldChange('notes_content', v)}
            placeholder="Enter your notes"
            readOnly={readOnly}
            syncKey={note.id}
            className="min-h-0 w-full flex-1"
          />
        </section>
      </div>

      <footer className="note-pad-inset note-summary-footer flex h-[7.5rem] max-h-[7.5rem] shrink-0 flex-col overflow-hidden border-t border-slate-300 py-5">
        {readOnly ? (
          <div className="note-bounded-field note-summary-input h-[5.5rem] max-h-[5.5rem] overflow-hidden whitespace-pre-wrap text-xs leading-relaxed text-slate-600">
            {summary || (
              <span className="text-slate-300">Write a summary</span>
            )}
          </div>
        ) : (
          <BoundedSummaryField
            value={summary}
            onChange={(v) => onFieldChange('summary_content', v)}
            placeholder="Write a summary"
            readOnly={false}
            syncKey={note.id}
          />
        )}
      </footer>
    </article>
  )
}
