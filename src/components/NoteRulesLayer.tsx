/** A4 본문 영역을 채울 줄 개수 (1.75rem 간격) */
const RULE_LINE_COUNT = 48

export default function NoteRulesLayer() {
  return (
    <div className="note-rules-layer" aria-hidden>
      {Array.from({ length: RULE_LINE_COUNT }, (_, i) => (
        <div key={i} className="note-rule-line" />
      ))}
    </div>
  )
}
