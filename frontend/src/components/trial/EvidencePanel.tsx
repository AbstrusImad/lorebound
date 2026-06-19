import { Quote } from 'lucide-react'
import type { EvidenceItem } from '../../types'

export function EvidencePanel({ evidence }: { evidence: EvidenceItem[] }) {
  if (evidence.length === 0) {
    return (
      <p className="text-sm text-bone/45">No external canon was needed to reach this verdict.</p>
    )
  }
  return (
    <ul className="space-y-3">
      {evidence.map((e, i) => (
        <li key={i} className="glass-panel p-3.5">
          <div className="flex items-start gap-2.5">
            <Quote size={15} color="var(--rune-cyan)" className="mt-0.5 shrink-0" />
            <div>
              <p className="text-sm text-bone/90">{e.canonRule}</p>
              <p className="mt-1 text-[12px] text-bone/50">{e.relevance}</p>
            </div>
          </div>
        </li>
      ))}
    </ul>
  )
}
