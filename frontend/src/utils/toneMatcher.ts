import type { Tone, World } from '../types'

// Tone affinity. A small hand-built matrix expresses which intended tones sit
// comfortably inside a world's tone tags. This drives the toneMatch quantity.

const AFFINITY: Record<string, string[]> = {
  Mythic: ['Mythic', 'Hopeful', 'Mysterious', 'Tragic', 'Political'],
  Dark: ['Dark', 'Mysterious', 'Tragic', 'Political'],
  Hopeful: ['Hopeful', 'Mythic'],
  Political: ['Political', 'Dark', 'Mythic'],
  Mysterious: ['Mysterious', 'Mythic', 'Dark', 'Hopeful'],
  Technical: ['Technical'],
  Comedic: ['Comedic'],
  Tragic: ['Tragic', 'Dark', 'Mythic']
}

export function toneMatchScore(world: World, tone: Tone): number {
  const tags = world.toneTags.length > 0 ? world.toneTags : (['Mythic'] as Tone[])
  if (tags.includes(tone)) return 96
  const allowed = AFFINITY[tone] || []
  const overlap = tags.filter((t) => allowed.includes(t)).length
  if (overlap >= 2) return 82
  if (overlap === 1) return 68
  // Comedic / Technical against a mythic world are the classic mismatches.
  if (tone === 'Comedic' || tone === 'Technical') return 24
  return 40
}

export function toneAligned(world: World, tone: Tone): boolean {
  return toneMatchScore(world, tone) >= 60
}
