/** 본문 HTML — bold(b/strong), br만 허용 */
export function sanitizeNotesHtml(html: string): string {
  if (!html || !html.includes('<')) return html
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<(?!\/?(?:b|strong|br)\b)[^>]+>/gi, '')
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

function plainTextToEditorHtml(text: string): string {
  return escapeHtml(text).replace(/\n/g, '<br>')
}

function isBreakOnlyBlock(el: HTMLElement): boolean {
  const meaningful = Array.from(el.childNodes).filter((node) => {
    if (node.nodeType === Node.TEXT_NODE) {
      return Boolean(node.textContent?.trim())
    }
    return true
  })
  if (meaningful.length === 0) return true
  return meaningful.length === 1 && meaningful[0].nodeName === 'BR'
}

function collapseEmptyLineBlocksInPlace(root: HTMLElement): void {
  root.querySelectorAll('div, p').forEach((block) => {
    if (isBreakOnlyBlock(block as HTMLElement)) {
      block.replaceWith(document.createElement('br'))
    }
  })
}

/** `<div><br></div>` 같은 빈 블록이 줄바꿈을 두 번 만들지 않도록 정리 (저장된 HTML 로드용) */
function collapseEmptyLineBlocks(html: string): string {
  if (!html.includes('<') || typeof document === 'undefined') return html

  const root = document.createElement('div')
  root.innerHTML = html
  collapseEmptyLineBlocksInPlace(root)
  return root.innerHTML.replace(/(?:<br\s*\/?>\s*){3,}/gi, '<br><br>')
}

function processNodeToBrHtml(parent: Node): string {
  const chunks: string[] = []

  parent.childNodes.forEach((node) => {
    if (node.nodeType === Node.TEXT_NODE) {
      chunks.push(node.textContent ?? '')
      return
    }
    if (node.nodeType !== Node.ELEMENT_NODE) return

    const el = node as HTMLElement
    const tag = el.tagName.toLowerCase()

    if (tag === 'br') {
      chunks.push('<br>')
    } else if (tag === 'b' || tag === 'strong') {
      const inner = processNodeToBrHtml(el)
      if (inner) chunks.push(`<${tag}>${inner}</${tag}>`)
    } else if (tag === 'div' || tag === 'p') {
      if (isBreakOnlyBlock(el)) {
        chunks.push('<br>')
        return
      }
      if (chunks.length > 0) {
        chunks.push('<br>')
      }
      chunks.push(processNodeToBrHtml(el))
    } else {
      chunks.push(processNodeToBrHtml(el))
    }
  })

  return chunks.join('')
}

function normalizeBlockElementsToBr(html: string): string {
  if (typeof document === 'undefined') return html

  const container = document.createElement('div')
  container.innerHTML = collapseEmptyLineBlocks(html)
  return processNodeToBrHtml(container)
}

function normalizeBlockElementsToBrFromElement(root: HTMLElement): string {
  collapseEmptyLineBlocksInPlace(root)
  return processNodeToBrHtml(root)
}

function editorInnerText(el: HTMLElement): string {
  return el.innerText.replace(/\r\n?/g, '\n')
}

function hasMeaningfulBoldInElement(el: HTMLElement): boolean {
  return Array.from(el.querySelectorAll('b, strong')).some(
    (node) => (node.textContent ?? '').length > 0,
  )
}

function hasBoldMarkup(value: string): boolean {
  if (!/<(?:b|strong)\b/i.test(value)) return false
  if (typeof document === 'undefined') return true

  const el = document.createElement('div')
  el.innerHTML = value
  return hasMeaningfulBoldInElement(el)
}

function isBoldFontWeight(weight: string): boolean {
  if (!weight) return false
  if (weight === 'bold' || weight === 'bolder') return true
  const numeric = Number.parseInt(weight, 10)
  return !Number.isNaN(numeric) && numeric >= 600
}

function normalizeBoldSpansInElement(root: HTMLElement): void {
  root.querySelectorAll('span').forEach((span) => {
    if (!isBoldFontWeight(span.style.fontWeight)) return
    const bold = document.createElement('b')
    while (span.firstChild) bold.appendChild(span.firstChild)
    span.replaceWith(bold)
  })
}

/** Browser bold (often `<span style="font-weight: ...">`) → `<b>` for storage. */
export function normalizeEditorBoldTags(html: string): string {
  if (!html.includes('<') || typeof document === 'undefined') return html

  const container = document.createElement('div')
  container.innerHTML = html
  normalizeBoldSpansInElement(container)
  return container.innerHTML
}

export function normalizeEditorBoldTagsInPlace(el: HTMLElement): void {
  normalizeBoldSpansInElement(el)
}

function isStoredNotesHtml(value: string): boolean {
  if (!value.includes('<')) return false
  return hasBoldMarkup(value) || /<br\s*\/?>/i.test(value)
}

function prepareEditorHtml(html: string): string {
  return collapseEmptyLineBlocks(normalizeEditorBoldTags(html))
}

/**
 * contentEditable DOM → DB 저장 형식.
 * innerHTML 문자열을 다시 파싱하지 않고 live DOM에서 읽어 `<` 문자·줄바꿈이 깨지지 않게 함.
 */
export function serializeNotesEditorElement(el: HTMLElement): string {
  const clone = el.cloneNode(true) as HTMLElement
  normalizeBoldSpansInElement(clone)

  if (!hasMeaningfulBoldInElement(clone)) {
    return editorInnerText(el)
  }

  return sanitizeNotesHtml(normalizeBlockElementsToBrFromElement(clone))
}

/** @deprecated Prefer serializeNotesEditorElement when the live editor element is available. */
export function serializeNotesEditorHtml(html: string): string {
  if (!html) return ''
  if (!html.includes('<')) return html
  if (typeof document === 'undefined') return html

  const el = document.createElement('div')
  el.innerHTML = html
  return serializeNotesEditorElement(el)
}

export function isNotesContentEmpty(value: string): boolean {
  if (!value) return true
  const text = value.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim()
  return text.length === 0
}

export function notesHtmlForDisplay(html: string): string {
  return sanitizeNotesHtml(
    normalizeBlockElementsToBr(prepareEditorHtml(html)),
  )
}

/** 화면/인쇄 공통 — 줄바꿈이 줄 간격과 1:1로 맞도록 HTML로 렌더 */
export function notesContentToDisplayHtml(value: string): string {
  if (!value) return ''
  if (isStoredNotesHtml(value)) {
    return notesHtmlForDisplay(value)
  }
  return plainTextToEditorHtml(value.replace(/\r\n?/g, '\n'))
}

export function setNotesEditorContent(el: HTMLElement, value: string): void {
  if (!value) {
    el.innerHTML = ''
    return
  }
  el.innerHTML = notesContentToDisplayHtml(value)
}

export function notesContentMatchesEditor(
  editorEl: HTMLElement,
  storedValue: string,
): boolean {
  return serializeNotesEditorElement(editorEl) === storedValue
}
