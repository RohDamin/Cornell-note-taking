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

/** `<div><br></div>` 같은 빈 블록이 줄바꿈을 두 번 만들지 않도록 정리 */
function collapseEmptyLineBlocks(html: string): string {
  if (!html.includes('<') || typeof document === 'undefined') return html

  const root = document.createElement('div')
  root.innerHTML = html

  root.querySelectorAll('div, p').forEach((block) => {
    if (isBreakOnlyBlock(block as HTMLElement)) {
      block.replaceWith(document.createElement('br'))
    }
  })

  return root.innerHTML.replace(/(?:<br\s*\/?>\s*){3,}/gi, '<br><br>')
}

function normalizeBlockElementsToBr(html: string): string {
  if (typeof document === 'undefined') return html

  const container = document.createElement('div')
  container.innerHTML = collapseEmptyLineBlocks(html)

  function processNode(parent: Node): string {
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
        const inner = processNode(el)
        if (inner) chunks.push(`<${tag}>${inner}</${tag}>`)
      } else if (tag === 'div' || tag === 'p') {
        if (isBreakOnlyBlock(el)) {
          chunks.push('<br>')
          return
        }
        if (chunks.length > 0) {
          chunks.push('<br>')
        }
        chunks.push(processNode(el))
      } else {
        chunks.push(processNode(el))
      }
    })

    return chunks.join('')
  }

  return processNode(container)
}

function editorHtmlToPlainText(html: string): string {
  const el = document.createElement('div')
  el.innerHTML = collapseEmptyLineBlocks(html)
  return el.innerText.replace(/\r\n?/g, '\n')
}

function hasBoldMarkup(value: string): boolean {
  return /<(?:b|strong)\b/i.test(value)
}

function isBoldFontWeight(weight: string): boolean {
  if (!weight) return false
  if (weight === 'bold' || weight === 'bolder') return true
  const numeric = Number.parseInt(weight, 10)
  return !Number.isNaN(numeric) && numeric >= 600
}

/** Browser bold (often `<span style="font-weight: ...">`) → `<b>` for storage. */
export function normalizeEditorBoldTags(html: string): string {
  if (!html.includes('<') || typeof document === 'undefined') return html

  const container = document.createElement('div')
  container.innerHTML = html

  container.querySelectorAll('span').forEach((span) => {
    if (!isBoldFontWeight(span.style.fontWeight)) return
    const bold = document.createElement('b')
    while (span.firstChild) bold.appendChild(span.firstChild)
    span.replaceWith(bold)
  })

  return container.innerHTML
}

function isStoredNotesHtml(value: string): boolean {
  if (!value.includes('<')) return false
  return hasBoldMarkup(value) || /<br\b/i.test(value)
}

function prepareEditorHtml(html: string): string {
  return collapseEmptyLineBlocks(normalizeEditorBoldTags(html))
}

/** contentEditable HTML → DB 저장 형식 (줄바꿈 보존) */
export function serializeNotesEditorHtml(html: string): string {
  if (!html) return ''
  if (!html.includes('<')) return html

  const normalized = prepareEditorHtml(html)

  if (!hasBoldMarkup(normalized)) {
    return editorHtmlToPlainText(normalized)
  }

  return sanitizeNotesHtml(normalizeBlockElementsToBr(normalized))
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
  editorHtml: string,
  storedValue: string,
): boolean {
  return serializeNotesEditorHtml(editorHtml) === storedValue
}
