/** 본문 HTML — bold(b/strong), br만 허용 */
export function sanitizeNotesHtml(html: string): string {
  if (!html || !html.includes('<')) return html
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<(?!\/?(?:b|strong|br)\b)[^>]+>/gi, '')
}

export function isNotesContentEmpty(value: string): boolean {
  if (!value) return true
  const text = value.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim()
  return text.length === 0
}

export function setNotesEditorContent(el: HTMLElement, value: string): void {
  if (value.includes('<')) {
    el.innerHTML = sanitizeNotesHtml(value)
  } else {
    el.innerText = value
  }
}
