import { useState } from 'react'
import { Fingerprint, Check } from 'lucide-react'
import { shortHash } from '../../utils/formatters'

interface Props {
  hash: string
  label?: string
}

export function ProofHashBadge({ hash, label = 'Proof' }: Props) {
  const [copied, setCopied] = useState(false)
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(hash)
      setCopied(true)
      setTimeout(() => setCopied(false), 1400)
    } catch {
      /* clipboard may be unavailable */
    }
  }
  return (
    <button
      type="button"
      onClick={copy}
      className="rune-chip inline-flex items-center gap-2 hover:border-rune transition-colors"
      title="Copy proof hash"
      aria-label={`${label} hash ${hash}`}
    >
      {copied ? <Check size={12} color="var(--success-mint)" /> : <Fingerprint size={12} color="var(--rune-cyan)" />}
      <span className="text-bone/70">{label}</span>
      <span className="text-rune">{shortHash(hash)}</span>
    </button>
  )
}
