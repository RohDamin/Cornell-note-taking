import type { ClipboardEvent } from 'react'
import { sanitizePastedNotesHtml } from './notesContent'

/** Paste clipboard text without carrying over external fonts, colors, or sizes. */
export function pastePlainTextFromClipboard(e: ClipboardEvent): boolean {
  const text = e.clipboardData?.getData('text/plain')
  if (text == null) return false

  e.preventDefault()
  document.execCommand('insertText', false, text)
  return true
}

/** Paste notes content keeping bold only; strip fonts, colors, sizes, etc. */
export function pasteNotesContentFromClipboard(e: ClipboardEvent): boolean {
  const plain = e.clipboardData?.getData('text/plain')
  const html = e.clipboardData?.getData('text/html')

  if (plain == null && !html) return false

  e.preventDefault()

  if (!html?.trim()) {
    document.execCommand('insertText', false, plain ?? '')
    return true
  }

  const sanitized = sanitizePastedNotesHtml(html)
  const hasBold = /<(?:b|strong)\b/i.test(sanitized)

  if (!hasBold) {
    document.execCommand('insertText', false, plain ?? '')
    return true
  }

  document.execCommand('insertHTML', false, sanitized)
  return true
}

export function mergePlainTextPaste(
  current: string,
  pasted: string,
  selectionStart: number,
  selectionEnd: number,
): string {
  return current.slice(0, selectionStart) + pasted + current.slice(selectionEnd)
}
