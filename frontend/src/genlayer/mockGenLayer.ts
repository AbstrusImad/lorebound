import type { EvaluationResult, Proposal, World } from '../types'
import { evaluateLoreProposal } from '../utils/localCanonEngine'

// The mock GenLayer path. It runs the deep local engine and simulates the
// staged consensus flow (wallet -> submitted -> consensus -> confirmed) so the
// Continuity Trial feels like a real on-chain evaluation while staying fully
// offline. This is the default demo path.

export type TrialStage =
  | { phase: 'wallet' }
  | { phase: 'submitted'; txHash: string }
  | { phase: 'consensus'; status: string; draft?: Partial<EvaluationResult> }
  | { phase: 'confirmed'; result: EvaluationResult; txHash: string }
  | { phase: 'error'; message: string }

export type StageCallback = (stage: TrialStage) => void

function fakeTxHash(seed: string): string {
  let h = 2166136261
  for (const ch of seed) {
    h ^= ch.charCodeAt(0)
    h = Math.imul(h, 16777619) >>> 0
  }
  const hex = (h >>> 0).toString(16).padStart(8, '0')
  return '0x' + hex.repeat(8).slice(0, 64)
}

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms))

const reducedMotion = () =>
  typeof window !== 'undefined' &&
  window.matchMedia &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches

export async function submitLoreProposal(
  world: World,
  proposal: Proposal,
  onStage?: StageCallback
): Promise<EvaluationResult> {
  const stage = onStage || (() => undefined)
  const fast = reducedMotion()
  const step = (ms: number) => wait(fast ? 0 : ms)

  stage({ phase: 'wallet' })
  await step(420)

  const txHash = fakeTxHash(proposal.proposalId + proposal.title + Date.now())
  stage({ phase: 'submitted', txHash })
  await step(520)

  // Compute the result first so the leader peek matches the final.
  const result = evaluateLoreProposal(world, proposal)

  stage({
    phase: 'consensus',
    status: 'PROPOSING',
    draft: { verdict: result.verdict, canonFitScore: result.canonFitScore }
  })
  await step(640)
  stage({
    phase: 'consensus',
    status: 'REVEALING',
    draft: {
      verdict: result.verdict,
      canonFitScore: result.canonFitScore,
      continuityRisk: result.continuityRisk
    }
  })
  await step(640)

  stage({ phase: 'confirmed', result, txHash })
  return result
}

export function getMockStatus(world: World) {
  const accepted = world.artifacts.length
  return {
    mode: 'mock' as const,
    online: true,
    contract: '0x0000000000000000000000000000000000000000',
    deployed: false,
    worlds: 1,
    artifacts: accepted,
    proposals: accepted,
    accepted
  }
}
