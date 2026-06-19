import { PenLine } from 'lucide-react'

export function RevisionSuggestion({ text }: { text: string | null }) {
  if (!text) return null
  return (
    <div
      className="glass-panel flex items-start gap-3 p-4"
      style={{ borderColor: 'rgba(244,201,93,0.35)', background: 'rgba(244,201,93,0.06)' }}
    >
      <PenLine size={16} color="var(--myth-gold)" className="mt-0.5 shrink-0" />
      <div>
        <p className="text-[11px] uppercase tracking-[0.18em] text-gold">Suggested revision</p>
        <p className="mt-1 text-sm text-bone/85">{text}</p>
      </div>
    </div>
  )
}
