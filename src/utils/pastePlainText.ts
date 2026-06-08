import type { ClipboardEvent } from 'react'

/** Paste clipboard text without carrying over external fonts, colors, or sizes. */
export function pastePlainTextFromClipboard(e: ClipboardEvent): boolean {
  const text = e.clipboardData?.getData('text/plain')
  if (text == null) return false

  e.preventDefault()
  document.execCommand('insertText', false, text)
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
