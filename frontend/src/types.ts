// Core domain types for Lorebound. These mirror the contract's JSON shapes so
// the local engine, the mock GenLayer layer and the real chain layer all speak
// the same language.

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

export type Verdict = 'ACCEPTED' | 'REJECTED' | 'NEEDS_REVISION' | 'NEEDS_HUMAN_VOTE'

export type ArtifactStatus = 'canon' | 'rejected' | 'revision'

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
  // visual placement on the constellation atlas (0..1 normalized)
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
  toneTags: Tone[]
  created: string
  artifacts: CanonArtifact[]
}

export interface EvidenceItem {
  canonRule: string
  relevance: string
}

export interface ValidatorResult {
  validator: string
  status: 'accepted' | 'rejected'
  reason: string
  checked?: string
  evidence?: string
  fault?: string
}

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

export interface EvaluationResult {
  proposalId: string
  title: string
  type: LoreType
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
  // local-only enrichment for the constellation preview
  contradictions?: string[]
  similarTo?: string[]
  evaluatedAt?: string
}

export type GenLayerMode = 'mock' | 'real'

export interface GenLayerStatus {
  mode: GenLayerMode
  online: boolean
  contract: string
  deployed: boolean
  note?: string
  worlds?: number
  artifacts?: number
  proposals?: number
  accepted?: number
}
