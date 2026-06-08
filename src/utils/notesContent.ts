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

function normalizeBlockElementsToBr(html: string): string {
  if (typeof document === 'undefined') return html

  const container = document.createElement('div')
  container.innerHTML = html

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
        if (chunks.length > 0) chunks.push('<br>')
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
  el.innerHTML = html
  return el.innerText.replace(/\r\n?/g, '\n')
}

function hasBoldMarkup(value: string): boolean {
  return /<(?:b|strong)\b/i.test(value)
}

function isStoredNotesHtml(value: string): boolean {
  if (!value.includes('<')) return false
  return hasBoldMarkup(value) || /<br\b/i.test(value)
}

/** contentEditable HTML → DB 저장 형식 (줄바꿈 보존) */
export function serializeNotesEditorHtml(html: string): string {
  if (!html) return ''
  if (!html.includes('<')) return html

  if (!hasBoldMarkup(html)) {
    return editorHtmlToPlainText(html)
  }

  return sanitizeNotesHtml(normalizeBlockElementsToBr(html))
}

export function isNotesContentEmpty(value: string): boolean {
  if (!value) return true
  const text = value.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim()
  return text.length === 0
}

export function notesHtmlForDisplay(html: string): string {
  return sanitizeNotesHtml(normalizeBlockElementsToBr(html))
}

export function setNotesEditorContent(el: HTMLElement, value: string): void {
  if (!value) {
    el.innerHTML = ''
    return
  }
  if (isStoredNotesHtml(value)) {
    el.innerHTML = notesHtmlForDisplay(value)
    return
  }
  el.innerHTML = plainTextToEditorHtml(value)
}

export function notesContentMatchesEditor(
  editorHtml: string,
  storedValue: string,
): boolean {
  return serializeNotesEditorHtml(editorHtml) === storedValue
}
