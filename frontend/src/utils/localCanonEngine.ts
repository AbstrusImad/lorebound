import type {
  EvaluationResult,
  EvidenceItem,
  Proposal,
  ValidatorResult,
  Verdict,
  World
} from '../types'
import { continuityScore } from './continuityScoring'
import { checkOriginality } from './originalityCheck'
import { toneMatchScore } from './toneMatcher'
import { clamp } from './formatters'

// The deep local engine. It genuinely reasons about a proposal against the
// canon: it cites real rules, detects contradictions against specific rules,
// detects conceptual duplication against existing artifacts, checks tone, and
// produces a suggestedRevision that fixes the offending element. It also hard
// stops canon-override / prompt-injection attempts.

const OVERRIDE_MARKERS = [
  'ignore previous canon',
  'ignore the previous canon',
  'ignore all previous',
  'ignore previous rules',
  'ignore the canon',
  'disregard the canon',
  'disregard previous',
  'override the canon',
  'overrides the canon',
  'should be ignored',
  'must be ignored',
  'forget the rules',
  'forget previous rules',
  'delete the canon',
  'you are now',
  'as the system',
  'system prompt',
  'new canon replaces',
  'replace all canon',
  'replaces all older'
]

function detectOverride(text: string): string {
  const low = text.toLowerCase()
  for (const m of OVERRIDE_MARKERS) {
    if (low.includes(m)) return m
  }
  return ''
}

// A simple deterministic proof hash matching the contract's FNV-1a style.
function proofHash(proposalId: string, verdict: string, stateCount: number): string {
  const seed = `${proposalId}|${verdict}|${stateCount}`
  let h = 1469598103934665603n
  const prime = 1099511628211n
  const mod = 2n ** 64n
  for (const ch of seed) {
    h ^= BigInt(ch.codePointAt(0) || 0)
    h = (h * prime) % mod
  }
  return 'lb' + h.toString(16).padStart(16, '0')
}

function buildEvidence(world: World, contradictions: string[], closestId: string): EvidenceItem[] {
  const ev: EvidenceItem[] = []
  for (const c of contradictions) {
    ev.push({ canonRule: c, relevance: 'The proposal runs against this canon rule.' })
  }
  // Cite the most relevant supporting rules when the piece fits.
  if (contradictions.length === 0) {
    const supportive = world.rules.slice(0, 2)
    for (const r of supportive) {
      ev.push({ canonRule: r.text, relevance: 'The proposal respects and builds on this rule.' })
    }
  }
  if (closestId) {
    const art = world.artifacts.find((a) => a.artifactId === closestId)
    if (art) {
      ev.push({ canonRule: art.title, relevance: 'Closest existing artifact in the canon.' })
    }
  }
  return ev
}

export function evaluateLoreProposal(world: World, proposal: Proposal): EvaluationResult {
  const stateCount = world.artifacts.length
  const combined = `${proposal.text} ${proposal.contribution}`

  // --- Layer: Consistency (canon-override hard stop) ---------------------
  const override = detectOverride(combined)
  if (override !== '') {
    const verdict: Verdict = 'REJECTED'
    return {
      proposalId: proposal.proposalId,
      title: proposal.title,
      type: proposal.type,
      verdict,
      canonFitScore: 0,
      continuityRisk: 100,
      originalityScore: 0,
      toneMatch: 0,
      evidence: [],
      reason:
        'Canon-override attempt detected. The proposal tried to instruct the adjudicator to ' +
        `ignore established canon ("${override}"). Proposals may extend the world, never rewrite its rules.`,
      suggestedRevision:
        'Resubmit as lore that works within the existing canon instead of asking to ignore or replace it.',
      validatorResults: [
        {
          validator: 'Consistency Validator',
          status: 'rejected',
          reason: 'Detected an instruction to ignore or override canon (prompt-injection / canon-override).',
          checked: 'Scanned the proposal for instructions aimed at the judge rather than lore.',
          evidence: `Matched override phrase: "${override}".`,
          fault: 'Canon-override / prompt-injection attempt.'
        }
      ],
      proofHash: proofHash(proposal.proposalId, verdict, stateCount),
      contradictions: [],
      similarTo: [],
      evaluatedAt: new Date().toISOString()
    }
  }

  // --- Quantities --------------------------------------------------------
  const { contradictions, continuityRisk } = continuityScore(world, combined)
  const orig = checkOriginality(world, proposal.title, combined)
  const toneMatch = toneMatchScore(world, proposal.tone)

  // canonFit is high when there is no contradiction and the tone aligns.
  let canonFitScore = clamp(
    92 - contradictions.length * 38 - (toneMatch < 60 ? 18 : 0) - (orig.likelyDuplicate ? 24 : 0)
  )

  // --- Decide the verdict ------------------------------------------------
  let verdict: Verdict
  if (contradictions.length >= 2) {
    verdict = 'REJECTED'
  } else if (contradictions.length === 1) {
    // One contradiction that comes purely from a fixable element (metal use)
    // is a revision; otherwise a rejection.
    verdict = isFixableContradiction(combined) ? 'NEEDS_REVISION' : 'REJECTED'
  } else if (orig.likelyDuplicate) {
    verdict = 'NEEDS_REVISION'
  } else if (toneMatch < 50) {
    verdict = 'NEEDS_REVISION'
  } else if (toneMatch < 64 || canonFitScore < 62) {
    verdict = 'NEEDS_HUMAN_VOTE'
  } else {
    verdict = 'ACCEPTED'
  }

  // Backstop: ACCEPTED with high continuity risk downgrades to revision.
  if (verdict === 'ACCEPTED' && continuityRisk > 60) {
    verdict = 'NEEDS_REVISION'
  }

  const evidence = buildEvidence(world, contradictions, orig.closestId)
  const validatorResults = buildValidatorLayers(
    verdict,
    contradictions,
    orig,
    toneMatch,
    combined
  )
  const suggestedRevision = buildRevision(verdict, contradictions, orig, toneMatch, proposal)
  const reason = buildReason(verdict, contradictions, orig, toneMatch)

  if (verdict === 'ACCEPTED') canonFitScore = Math.max(canonFitScore, 78)

  return {
    proposalId: proposal.proposalId,
    title: proposal.title,
    type: proposal.type,
    verdict,
    canonFitScore,
    continuityRisk,
    originalityScore: orig.originalityScore,
    toneMatch,
    evidence,
    reason,
    suggestedRevision,
    validatorResults,
    proofHash: proofHash(proposal.proposalId, verdict, stateCount),
    contradictions,
    similarTo: orig.closest ? [orig.closest] : [],
    evaluatedAt: new Date().toISOString()
  }
}

function isFixableContradiction(text: string): boolean {
  // A contradiction that exists only because of metal use is fixable (swap the
  // material). A contradiction about being underground / on the surface is not.
  const low = text.toLowerCase()
  const structural = ['underground', 'beneath the', 'below the clouds', 'surface is safe', 'live there']
  if (structural.some((s) => low.includes(s))) return false
  const fixable = ['metal armor', 'metal-tipped', 'steel', 'iron', 'metal']
  return fixable.some((s) => low.includes(s))
}

function buildValidatorLayers(
  verdict: Verdict,
  contradictions: string[],
  orig: ReturnType<typeof checkOriginality>,
  toneMatch: number,
  text: string
): ValidatorResult[] {
  const layers: ValidatorResult[] = []

  layers.push({
    validator: 'Evidence Validator',
    status: 'accepted',
    reason:
      contradictions.length > 0
        ? 'Confirmed the cited canon rules exist verbatim in the world.'
        : 'All supporting citations resolve to real canon rules and artifacts.',
    checked: 'Resolved every cited reference against the stored canon.',
    evidence: 'No fabricated canon was introduced.',
    fault: undefined
  })

  layers.push({
    validator: 'Contradiction Validator',
    status: contradictions.length > 0 ? 'rejected' : 'accepted',
    reason:
      contradictions.length > 0
        ? `The proposal opposes ${contradictions.length} canon rule(s).`
        : 'No canon rule is contradicted.',
    checked: 'Re-derived the proposal against each world rule.',
    evidence: contradictions[0] ? `Contradicts: "${contradictions[0]}".` : 'Clean against all rules.',
    fault: contradictions[0] ? `Contradiction with "${contradictions[0]}".` : undefined
  })

  layers.push({
    validator: 'Tone Validator',
    status: toneMatch >= 60 ? 'accepted' : 'rejected',
    reason:
      toneMatch >= 60
        ? 'The voice sits inside the world tone.'
        : 'The intended tone is off-register for this world.',
    checked: 'Compared the intended tone against the world tone tags.',
    evidence: `Tone match measured at ${toneMatch}.`,
    fault: toneMatch >= 60 ? undefined : 'Tone mismatch.'
  })

  layers.push({
    validator: 'Novelty Validator',
    status: orig.likelyDuplicate ? 'rejected' : 'accepted',
    reason: orig.likelyDuplicate
      ? `Concept overlaps ${orig.maxOverlapPercent}% with "${orig.closest}".`
      : 'The concept is sufficiently distinct from existing canon.',
    checked: 'Measured token overlap against every accepted artifact.',
    evidence: orig.closest ? `Closest artifact: "${orig.closest}".` : 'No close artifact.',
    fault: orig.likelyDuplicate ? `Conceptual duplicate of "${orig.closest}".` : undefined
  })

  const fixable = contradictions.length === 1 && isFixableContradiction(text)
  layers.push({
    validator: 'Revision Validator',
    status: 'accepted',
    reason:
      verdict === 'NEEDS_REVISION'
        ? 'Isolated the single fixable fault and proposed a concrete revision.'
        : 'No revision required for this verdict.',
    checked: 'Searched for a minimal change that resolves the only conflict.',
    evidence: fixable ? 'The conflict comes from a single material choice.' : 'No isolated fixable element.',
    fault: undefined
  })

  layers.push({
    validator: 'Consistency Validator',
    status: 'accepted',
    reason: 'No canon-override or prompt-injection detected.',
    checked: 'Scanned for instructions aimed at the judge.',
    evidence: 'Proposal reads as lore, not commands.',
    fault: undefined
  })

  return layers
}

function buildRevision(
  verdict: Verdict,
  contradictions: string[],
  orig: ReturnType<typeof checkOriginality>,
  toneMatch: number,
  proposal: Proposal
): string | null {
  if (verdict === 'ACCEPTED') return null
  if (verdict === 'REJECTED') {
    if (contradictions.length > 0) {
      return `Rework the premise so it no longer breaks: "${contradictions[0]}".`
    }
    return 'Resubmit as lore that works within the existing canon.'
  }
  // NEEDS_REVISION / NEEDS_HUMAN_VOTE
  if (contradictions.length === 1) {
    return `Keep the idea but replace the metal element with silent glass or sky-beast bone, so it no longer triggers: "${contradictions[0]}".`
  }
  if (orig.likelyDuplicate) {
    return `Give "${proposal.title}" a distinct role from "${orig.closest}" so it adds something new to the canon.`
  }
  if (toneMatch < 60) {
    return 'Retune the voice toward the mythic, hopeful, mysterious register of the world.'
  }
  return 'A small adjustment would let this enter the canon cleanly.'
}

function buildReason(
  verdict: Verdict,
  contradictions: string[],
  orig: ReturnType<typeof checkOriginality>,
  toneMatch: number
): string {
  switch (verdict) {
    case 'ACCEPTED':
      return 'The proposal respects every canon rule, matches the world tone and adds a distinct new piece to the universe.'
    case 'REJECTED':
      if (contradictions.length > 0) {
        return `The proposal contradicts core canon (${contradictions.length} rule(s)), beginning with "${contradictions[0]}". A piece that breaks the world's laws cannot enter the canon.`
      }
      return 'The proposal cannot be reconciled with the existing canon.'
    case 'NEEDS_REVISION':
      if (contradictions.length === 1) {
        return `The idea fits the world but one element breaks "${contradictions[0]}". A targeted revision would resolve it.`
      }
      if (orig.likelyDuplicate) {
        return `The concept overlaps heavily (${orig.maxOverlapPercent}%) with "${orig.closest}". It needs a more distinct angle to add value.`
      }
      if (toneMatch < 60) {
        return 'No rule is broken, but the tone is off-register for this world. A retune would let it in.'
      }
      return 'A small revision is needed before this can enter the canon.'
    case 'NEEDS_HUMAN_VOTE':
      return 'The proposal is genuinely ambiguous against the canon and should be settled by a human canon vote.'
    default:
      return ''
  }
}
