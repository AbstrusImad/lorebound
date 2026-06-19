import type { Verdict } from '../types'

export function verdictLabel(v: Verdict): string {
  switch (v) {
    case 'ACCEPTED':
      return 'Accepted'
    case 'REJECTED':
      return 'Rejected'
    case 'NEEDS_REVISION':
      return 'Needs Revision'
    case 'NEEDS_HUMAN_VOTE':
      return 'Needs Human Canon Vote'
    default:
      return v
  }
}

export function verdictClass(v: Verdict): string {
  switch (v) {
    case 'ACCEPTED':
      return 'verdict-accepted'
    case 'REJECTED':
      return 'verdict-rejected'
    case 'NEEDS_REVISION':
      return 'verdict-revision'
    case 'NEEDS_HUMAN_VOTE':
      return 'verdict-vote'
    default:
      return ''
  }
}

export function verdictColor(v: Verdict): string {
  switch (v) {
    case 'ACCEPTED':
      return 'var(--success-mint)'
    case 'REJECTED':
      return 'var(--danger-ruby)'
    case 'NEEDS_REVISION':
      return 'var(--myth-gold)'
    case 'NEEDS_HUMAN_VOTE':
      return 'var(--spirit-blue)'
    default:
      return 'var(--muted-silver)'
  }
}

export function shortHash(h: string): string {
  if (!h) return ''
  if (h.length <= 12) return h
  return `${h.slice(0, 8)}...${h.slice(-4)}`
}

export function shortAddress(addr: string): string {
  if (!addr) return ''
  if (addr.length <= 12) return addr
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`
}

export function formatDate(d: string | number | Date): string {
  try {
    const date = typeof d === 'string' || typeof d === 'number' ? new Date(d) : d
    if (Number.isNaN(date.getTime())) return String(d)
    return date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
  } catch {
    return String(d)
  }
}

export function clamp(n: number, lo = 0, hi = 100): number {
  if (Number.isNaN(n)) return lo
  return Math.max(lo, Math.min(hi, Math.round(n)))
}
