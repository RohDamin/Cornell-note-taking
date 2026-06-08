import { useRef, useEffect, type ClipboardEvent, type KeyboardEvent } from 'react'
import NoteRulesLayer from './NoteRulesLayer'
import type { Note, NoteField, NotePageField } from '../types/note'
import {
  clampInnerTextToBox,
  fitsInBox,
  placeCaretAtEnd,
  clampTextareaValue,
} from '../utils/boundedText'
import {
  isNotesContentEmpty,
  normalizeEditorBoldTags,
  notesContentMatchesEditor,
  notesContentToDisplayHtml,
  serializeNotesEditorHtml,
  setNotesEditorContent,
} from '../utils/notesContent'
import {
  mergePlainTextPaste,
  pastePlainTextFromClipboard,
} from '../utils/pastePlainText'

interface NoteEditorProps {
  note: Note
  readOnly: boolean
  forPrint?: boolean
  pageIndex?: number
  continuationLayout?: boolean
  pageNumber?: number
  onFieldChange: (
    pageIndex: number,
    field: NoteField | NotePageField,
    value: string,
  ) => void
  onRemovePage?: () => void
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
      onPaste={(e) => {
        if (readOnly) return
        if (!pastePlainTextFromClipboard(e)) return
        if (ref.current) handleInput(ref.current)
      }}
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

  const handlePaste = (e: ClipboardEvent<HTMLTextAreaElement>) => {
    if (readOnly) return
    const pasted = e.clipboardData?.getData('text/plain')
    if (pasted == null) return

    e.preventDefault()
    const el = e.currentTarget
    const start = el.selectionStart ?? 0
    const end = el.selectionEnd ?? 0
    handleChange(mergePlainTextPaste(value, pasted, start, end))
    requestAnimationFrame(() => {
      const pos = start + pasted.length
      el.setSelectionRange(pos, pos)
    })
  }

  return (
    <textarea
      ref={ref}
      value={value}
      readOnly={readOnly}
      onChange={(e) => handleChange(e.target.value)}
      onPaste={handlePaste}
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
    if (notesContentMatchesEditor(el.innerHTML, value)) return
    setNotesEditorContent(el, value)
  }, [syncKey, value])

  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      document.execCommand('insertLineBreak')
      if (ref.current) {
        onChange(serializeNotesEditorHtml(ref.current.innerHTML))
      }
      return
    }

    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'b') {
      e.preventDefault()
      document.execCommand('bold')
      if (ref.current) {
        const html = normalizeEditorBoldTags(ref.current.innerHTML)
        if (html !== ref.current.innerHTML) {
          ref.current.innerHTML = html
        }
        onChange(serializeNotesEditorHtml(html))
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
        ) : (
          <div
            className="lined-notes-input text-xs text-slate-600"
            dangerouslySetInnerHTML={{
              __html: notesContentToDisplayHtml(value),
            }}
          />
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
          onChange(serializeNotesEditorHtml(e.currentTarget.innerHTML))
        }
        onPaste={(e) => {
          if (!pastePlainTextFromClipboard(e)) return
          if (ref.current) {
            onChange(serializeNotesEditorHtml(ref.current.innerHTML))
          }
        }}
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
  pageIndex = 0,
  continuationLayout = false,
  pageNumber,
  onFieldChange,
  onRemovePage,
}: NoteEditorProps) {
  const isContinuation = continuationLayout || pageIndex > 0
  const extraPage = !continuationLayout && pageIndex > 0
    ? note.extra_pages?.[pageIndex - 1]
    : null

  const mainTitle = isContinuation ? '' : (note.main_title ?? '')
  const subTitle = isContinuation ? '' : (note.sub_title ?? '')
  const keywords = continuationLayout
    ? (note.keyword_content ?? '')
    : isContinuation
      ? (extraPage?.keyword_content ?? '')
      : (note.keyword_content ?? '')
  const body = continuationLayout
    ? (note.notes_content ?? '')
    : isContinuation
      ? (extraPage?.notes_content ?? '')
      : (note.notes_content ?? '')
  const summary = continuationLayout
    ? (note.summary_content ?? '')
    : isContinuation
      ? (extraPage?.summary_content ?? '')
      : (note.summary_content ?? '')

  const syncKey = `${note.id}-${pageIndex}${continuationLayout ? '-print' : ''}`
  const changeField = (field: NoteField | NotePageField, value: string) => {
    onFieldChange(pageIndex, field, value)
  }

  const titleClass = readOnly ? 'cursor-default text-slate-600' : 'text-slate-900'
  const displayPageNumber = pageNumber ?? (pageIndex > 0 ? pageIndex + 1 : null)

  return (
    <article
      id={forPrint || pageIndex > 0 ? undefined : 'note-pad'}
      className={`note-pad a4-pad mx-auto flex flex-col bg-white shadow-xl ${readOnly && !forPrint ? 'opacity-95' : ''}`}
    >
      {readOnly && !forPrint && pageIndex === 0 && (
        <div className="note-pad-inset shrink-0 bg-amber-50 py-1.5 text-center text-[10px] text-amber-700">
          Read-only — you cannot edit this note
        </div>
      )}

      {!isContinuation && (
        <>
          <input
            type="text"
            value={mainTitle}
            readOnly={readOnly}
            onChange={(e) => changeField('main_title', e.target.value)}
            placeholder="01. Enter a title"
            className={`note-pad-inset shrink-0 border-0 bg-transparent pt-8 text-2xl font-bold tracking-tight placeholder:text-slate-300 focus:outline-none focus:ring-0 ${titleClass}`}
          />

          <input
            type="text"
            value={subTitle}
            readOnly={readOnly}
            onChange={(e) => changeField('sub_title', e.target.value)}
            placeholder="Enter a subtitle"
            className={`note-pad-inset mt-4 shrink-0 border-0 bg-transparent pb-4 text-base font-bold placeholder:text-slate-300 focus:outline-none focus:ring-0 ${readOnly ? 'text-slate-600' : 'text-slate-600'}`}
          />
        </>
      )}

      {isContinuation && displayPageNumber != null && (
        <div className="note-pad-inset flex shrink-0 items-center justify-between gap-3 pt-8 pb-4">
          <span className="text-[10px] font-medium tracking-wide text-slate-400 uppercase">
            Page {displayPageNumber}
          </span>
          {onRemovePage && (
            <button
              type="button"
              onClick={onRemovePage}
              className="note-remove-page-btn"
            >
              Remove page
            </button>
          )}
        </div>
      )}

      <div className="note-body-section flex min-h-0 flex-1 border-t border-slate-200">
        <section className="note-keyword-column note-pad-inset flex w-[25%] min-h-0 flex-col overflow-hidden border-r border-slate-200 py-3">
          {readOnly ? (
            <div className="note-bounded-field min-h-0 flex-1 overflow-hidden whitespace-pre-wrap text-xs leading-relaxed text-slate-600">
              {keywords || <span className="text-slate-300">Keywords</span>}
            </div>
          ) : (
            <PlainEditable
              value={keywords}
              onChange={(v) => changeField('keyword_content', v)}
              placeholder="Keywords"
              readOnly={false}
              syncKey={syncKey}
              clampToBounds
              className="min-h-0 flex-1 text-xs leading-relaxed text-slate-800"
            />
          )}
        </section>

        <section className="note-pad-inset-right notes-column flex min-h-0 w-[75%] flex-col overflow-hidden py-3">
          <LinedNotesArea
            value={body}
            onChange={(v) => changeField('notes_content', v)}
            placeholder="Enter your notes"
            readOnly={readOnly}
            syncKey={syncKey}
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
            onChange={(v) => changeField('summary_content', v)}
            placeholder="Write a summary"
            readOnly={false}
            syncKey={syncKey}
          />
        )}
      </footer>
    </article>
  )
}
