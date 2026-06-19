// Core domain types for Lorebound. These mirror the deployed GenLayer Bradbury
// contract's JSON shapes, so the read helpers and every page speak the same
// language. Every value here is filled from on-chain reads only.

export type LoreType =
  | 'Character'
  | 'Location'
  | 'Relic'
  | 'Creature'
  | 'Faction'
  | 'Event'
  | 'Magic Rule'
  | 'Technology'
  | 'Custom'

export type Tone =
  | 'Mythic'
  | 'Dark'
  | 'Hopeful'
  | 'Political'
  | 'Mysterious'
  | 'Technical'
  | 'Comedic'
  | 'Tragic'

export type Verdict = 'ACCEPTED' | 'REJECTED' | 'NEEDS_REVISION' | 'NEEDS_HUMAN_VOTE' | ''

export interface CanonRule {
  id: string
  text: string
}

export interface CanonArtifact {
  artifactId: string
  worldId: string
  title: string
  type: LoreType
  summary: string
  canonFitScore: number
  proofHash: string
  sourceProposal: string
  accepted: string
  acceptedDate: string
  // visual placement on the constellation atlas (0..1 normalized), computed
  // client-side for layout only. The data itself is read from chain.
  x: number
  y: number
  connections: string[]
  image?: string
}

export interface World {
  worldId: string
  name: string
  rules: CanonRule[]
  tone: string
  toneTags: string[]
  created: string
  artifacts: CanonArtifact[]
}

export interface EvidenceItem {
  canonRule: string
  relevance: string
}

export interface ValidatorResult {
  validator: string
  status: string
  reason: string
}

// The proposal as it lives on chain after evaluation. It carries both the
// authored fields and the consensus verdict, scores, evidence and validator
// results. This is the trial / verdict record the UI renders.
export interface ChainProposal {
  proposalId: string
  worldId: string
  title: string
  type: LoreType
  text: string
  contribution: string
  tone: string
  tags: string[]
  status: string
  author: string
  verdict: Verdict
  canonFitScore: number
  continuityRisk: number
  originalityScore: number
  toneMatch: number
  evidence: EvidenceItem[]
  reason: string
  suggestedRevision: string | null
  validatorResults: ValidatorResult[]
  proofHash: string
  evaluatedAt?: string
}

// The authored proposal payload submitted to the contract.
export interface Proposal {
  proposalId: string
  worldId: string
  title: string
  type: LoreType
  text: string
  contribution: string
  tone: Tone
  tags: string[]
  author?: string
}

export interface ContractStats {
  worlds: number
  artifacts: number
  proposals: number
  accepted: number
}
