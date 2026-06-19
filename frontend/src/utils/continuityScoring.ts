import type { World } from '../types'

// Deterministic contradiction detection mirroring the contract's opposition
// scan. Each pair is (ruleMarker, proposalMarker): if the canon rule contains
// ruleMarker and the proposal contains proposalMarker, that is a likely
// contradiction against that specific rule.

const OPPOSITIONS: [string, string][] = [
  ['float', 'underground'],
  ['float', 'below the clouds'],
  ['float', 'beneath the'],
  ['above the storm', 'underground'],
  ['silent glass', 'steel'],
  ['silent glass', 'metal tower'],
  ['metal attracts', 'metal armor'],
  ['metal attracts', 'metal-tipped'],
  ['metal attracts', 'steel'],
  ['metal attracts', 'iron'],
  ['cursed', 'build on the surface'],
  ['cursed', 'live there'],
  ['cursed', 'surface is safe'],
  ['cursed', 'settle the ground'],
  ['no one knows', 'explored the surface'],
  ['no one knows', 'what lies beneath is']
]

export interface ContinuityResult {
  contradictions: string[]
  continuityRisk: number
}

export function scanContradictions(world: World, text: string): string[] {
  const low = text.toLowerCase()
  const hits: string[] = []
  for (const rule of world.rules) {
    const rl = rule.text.toLowerCase()
    for (const [ruleMarker, propMarker] of OPPOSITIONS) {
      if (rl.includes(ruleMarker) && low.includes(propMarker) && !hits.includes(rule.text)) {
        hits.push(rule.text)
      }
    }
  }
  return hits
}

export function continuityScore(world: World, text: string): ContinuityResult {
  const contradictions = scanContradictions(world, text)
  // Each contradicted rule contributes risk; more contradictions, more risk.
  const risk = Math.min(100, contradictions.length * 42 + (contradictions.length > 0 ? 18 : 6))
  return { contradictions, continuityRisk: risk }
}
