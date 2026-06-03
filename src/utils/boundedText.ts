/** True when element content fits without scrolling. */
export function fitsInBox(el: HTMLElement): boolean {
  return (
    el.scrollHeight <= el.clientHeight + 1 &&
    el.scrollWidth <= el.clientWidth + 1
  )
}

export function placeCaretAtEnd(el: HTMLElement): void {
  const range = document.createRange()
  range.selectNodeContents(el)
  range.collapse(false)
  const sel = window.getSelection()
  if (!sel) return
  sel.removeAllRanges()
  sel.addRange(range)
}

/** Trim plain text until it fits inside a contenteditable box. */
export function clampInnerTextToBox(el: HTMLElement, text: string): string {
  el.innerText = text
  if (fitsInBox(el)) return text

  let trimmed = text
  while (trimmed.length > 0 && !fitsInBox(el)) {
    trimmed = trimmed.slice(0, -1)
    el.innerText = trimmed
  }
  return trimmed
}

/** Trim text until it fits inside a textarea's fixed box. */
export function clampTextareaValue(textarea: HTMLTextAreaElement, text: string): string {
  textarea.value = text
  if (fitsInBox(textarea)) return text

  let trimmed = text
  while (trimmed.length > 0 && !fitsInBox(textarea)) {
    trimmed = trimmed.slice(0, -1)
    textarea.value = trimmed
  }
  return trimmed
}
