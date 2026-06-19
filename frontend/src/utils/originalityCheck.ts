import type { World } from '../types'

// Conceptual duplication detection via token overlap, mirroring the contract's
// deterministic originality view.

const STOP = new Set([
  'that',
  'this',
  'with',
  'from',
  'into',
  'they',
  'them',
  'their',
  'used',
  'uses',
  'using',
  'most',
  'into',
  'over',
  'than',
  'then',
  'also',
  'some',
  'such',
  'have',
  'been',
  'were',
  'will',
  'whose',
  'which',
  'about',
  'between'
])

export function tokenize(text: string): Set<string> {
  const out = new Set<string>()
  const words = text.toLowerCase().match(/[a-z0-9]{4,}/g) || []
  for (const w of words) {
    if (!STOP.has(w)) out.add(w)
  }
  return out
}

export function overlapRatio(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 || b.size === 0) return 0
  let inter = 0
  for (const t of a) if (b.has(t)) inter += 1
  const smaller = Math.min(a.size, b.size)
  return Math.round((inter * 100) / smaller)
}

export interface OriginalityResult {
  originalityScore: number
  maxOverlapPercent: number
  closest: string
  closestId: string
  likelyDuplicate: boolean
}

export function checkOriginality(world: World, title: string, text: string): OriginalityResult {
  const probe = tokenize(`${title} ${text}`)
  let best = 0
  let closest = ''
  let closestId = ''
  for (const art of world.artifacts) {
    const other = tokenize(`${art.title} ${art.summary}`)
    const ov = overlapRatio(probe, other)
    if (ov > best) {
      best = ov
      closest = art.title
      closestId = art.artifactId
    }
  }
  return {
    originalityScore: clampInv(best),
    maxOverlapPercent: best,
    closest,
    closestId,
    likelyDuplicate: best >= 60
  }
}

function clampInv(overlap: number): number {
  // Higher overlap => lower originality.
  const n = 100 - overlap
  return Math.max(0, Math.min(100, n))
}
