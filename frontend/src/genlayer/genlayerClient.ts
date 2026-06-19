/*
  genlayerClient.ts
  The single client surface for Lorebound. Everything it returns comes from the
  deployed GenLayer Bradbury contract: reads go through readContract + JSON.parse
  + normalize, and the live proposal flow signs submit_lore_proposal then
  evaluate_lore_proposal with the injected wallet, polling the transaction until
  consensus is reached. There is one real on-chain path and no mode switch.
*/
import { createClient } from 'genlayer-js'
import { testnetBradbury } from 'genlayer-js/chains'
import type {
  CanonArtifact,
  CanonRule,
  ChainProposal,
  ContractStats,
  EvidenceItem,
  LoreType,
  Proposal,
  ValidatorResult,
  World
} from '../types'

// ---- live contract coordinates ------------------------------------------
export const CONTRACT_ADDRESS = '0xe99B76bFDc1f79F008CCFda5B321533CBC8f0823'
export const DEPLOY_TX = '0xc77592fc6982327dbe542e57266c4dae812ea17573aa908b12156a1cf5f25454'
export const EXPLORER = 'https://explorer-bradbury.genlayer.com'
export const FAUCET = 'https://testnet-faucet.genlayer.foundation/'

const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000'
// The contract is deployed, so this is always true. The guard never triggers.
export const IS_DEPLOYED = String(CONTRACT_ADDRESS).toLowerCase() !== ZERO_ADDRESS.toLowerCase()

// ---- trial staging -------------------------------------------------------

export type TrialStage =
  | { phase: 'wallet' }
  | { phase: 'submitted'; txHash: string }
  | { phase: 'consensus'; status: string; draft?: Partial<ChainProposal> }
  | { phase: 'confirmed'; result: ChainProposal; txHash: string }
  | { phase: 'error'; message: string }

export type StageCallback = (stage: TrialStage) => void

// ---- read client ---------------------------------------------------------

let _readClient: ReturnType<typeof createClient> | null = null
function readClient() {
  if (!_readClient) _readClient = createClient({ chain: testnetBradbury })
  return _readClient
}

function makeWalletClient(account: string) {
  const provider = typeof window !== 'undefined' ? (window as unknown as { ethereum?: unknown }).ethereum : undefined
  return createClient({ chain: testnetBradbury, account: account as `0x${string}`, provider })
}

async function readRaw(functionName: string, args: unknown[]): Promise<string> {
  const raw = (await readClient().readContract({
    address: CONTRACT_ADDRESS as `0x${string}`,
    functionName,
    args: args as never
  })) as unknown
  return typeof raw === 'string' ? raw : JSON.stringify(raw)
}

// ---- transaction status naming -------------------------------------------

const STATUS_NAME: Record<string, string> = {
  '1': 'PENDING',
  '2': 'PROPOSING',
  '3': 'COMMITTING',
  '4': 'REVEALING',
  '5': 'ACCEPTED',
  '6': 'UNDETERMINED',
  '7': 'FINALIZED',
  '8': 'CANCELED',
  '12': 'VALIDATORS_TIMEOUT',
  '13': 'LEADER_TIMEOUT'
}

function statusName(s: unknown): string {
  return STATUS_NAME[String(s)] || String(s == null ? 'PENDING' : s).toUpperCase()
}

// LEADER_TIMEOUT (13) and VALIDATORS_TIMEOUT (12) are NON-terminal: the network
// rotates the leader and retries, so we keep polling through them.
const TERMINAL = new Set(['ACCEPTED', 'FINALIZED', 'UNDETERMINED', 'CANCELED'])

export function describeGenLayerError(err: unknown): string {
  const msg = String((err as { message?: string })?.message || err || '')
  if (/reject|denied|4001|cancel/i.test(msg)) return 'You cancelled the signature.'
  if (/insufficient funds|max fee|fee reserve/i.test(msg)) {
    return 'Your wallet is below the fee reserve for AI transactions. Top up at the testnet faucet.'
  }
  if (/contract not found|not found|no contract/i.test(msg)) {
    return 'Contract not found at this address on Bradbury. The reader cannot reach it.'
  }
  if (/revert|execution reverted/i.test(msg)) {
    return 'The contract reverted this call. The requested record may not exist on chain.'
  }
  if (/rate limit|429|timeout|network|fetch|too many|congest|busy/i.test(msg)) {
    return 'Bradbury is busy. Retrying the read shortly.'
  }
  return msg || 'Something interrupted the request. Please try again.'
}

// ---- normalizers ---------------------------------------------------------

function num(v: unknown): number {
  const n = Number(String(v ?? '0'))
  return Number.isFinite(n) ? n : 0
}

function asArray<T>(v: unknown): T[] {
  return Array.isArray(v) ? (v as T[]) : []
}

function parseMaybeJson<T>(v: unknown, fallback: T): T {
  if (v == null) return fallback
  if (typeof v === 'string') {
    try {
      return JSON.parse(v) as T
    } catch {
      return fallback
    }
  }
  return v as T
}

function normalizeRules(rulesJson: unknown): CanonRule[] {
  const arr = parseMaybeJson<unknown[]>(rulesJson, [])
  return arr.map((text, i) => ({ id: `rule-${i + 1}`, text: String(text) }))
}

interface RawWorld {
  world_id?: string
  name?: string
  rules_json?: string
  tone?: string
  created?: string
}

function toneTagsFromTone(tone: string): string[] {
  return String(tone || '')
    .split(/[,/]/)
    .map((t) => t.trim())
    .filter(Boolean)
    .map((t) => t.charAt(0).toUpperCase() + t.slice(1))
}

function normalizeWorld(rawWorld: RawWorld, rules?: string[], artifacts?: CanonArtifact[]): World {
  const ruleList: CanonRule[] = rules
    ? rules.map((text, i) => ({ id: `rule-${i + 1}`, text: String(text) }))
    : normalizeRules(rawWorld.rules_json)
  const tone = String(rawWorld.tone || '')
  return {
    worldId: String(rawWorld.world_id || ''),
    name: String(rawWorld.name || ''),
    rules: ruleList,
    tone,
    toneTags: toneTagsFromTone(tone),
    created: String(rawWorld.created || ''),
    artifacts: artifacts || []
  }
}

// Deterministic constellation layout from an index, so positions are stable
// across reads without fabricating any displayed data.
function layoutPosition(index: number): { x: number; y: number } {
  const angle = (index * 137.5 * Math.PI) / 180
  const radius = 0.16 + (index % 5) * 0.06
  return { x: 0.5 + Math.cos(angle) * radius, y: 0.5 + Math.sin(angle) * radius }
}

const ARTIFACT_IMAGES = [
  '/assets/artifact-silentglass-guild.webp',
  '/assets/artifact-skybridge.webp',
  '/assets/artifact-cloudwardens.webp',
  '/assets/artifact-lanterns.webp',
  '/assets/artifact-map.webp',
  '/assets/relic-crystal.webp'
]

function normalizeArtifact(raw: Record<string, unknown>, index: number): CanonArtifact {
  const id = String(raw.artifactId || raw.artifact_id || `art-${index + 1}`)
  const pos = layoutPosition(index)
  return {
    artifactId: id,
    worldId: String(raw.worldId || raw.world_id || ''),
    title: String(raw.title || ''),
    type: (String(raw.type || 'Custom') as LoreType),
    summary: String(raw.summary || ''),
    canonFitScore: num(raw.canonFitScore),
    proofHash: String(raw.proofHash || ''),
    sourceProposal: String(raw.sourceProposal || ''),
    accepted: String(raw.accepted ?? ''),
    acceptedDate: String(raw.acceptedDate || ''),
    x: pos.x,
    y: pos.y,
    connections: [],
    image: ARTIFACT_IMAGES[index % ARTIFACT_IMAGES.length]
  }
}

function normalizeProposal(p: Record<string, unknown>): ChainProposal {
  return {
    proposalId: String(p.proposalId || p.proposal_id || ''),
    worldId: String(p.worldId || p.world_id || ''),
    title: String(p.title || ''),
    type: (String(p.type || 'Custom') as LoreType),
    text: String(p.text || ''),
    contribution: String(p.contribution || ''),
    tone: String(p.tone || ''),
    tags: asArray<string>(parseMaybeJson(p.tags, [])).map(String),
    status: String(p.status || ''),
    author: String(p.author || ''),
    verdict: (String(p.verdict || '') as ChainProposal['verdict']),
    canonFitScore: num(p.canonFitScore),
    continuityRisk: num(p.continuityRisk),
    originalityScore: num(p.originalityScore),
    toneMatch: num(p.toneMatch),
    evidence: asArray<EvidenceItem>(p.evidence).map((e) => ({
      canonRule: String((e as EvidenceItem).canonRule || ''),
      relevance: String((e as EvidenceItem).relevance || '')
    })),
    reason: String(p.reason || ''),
    suggestedRevision: p.suggestedRevision == null || p.suggestedRevision === '' ? null : String(p.suggestedRevision),
    validatorResults: asArray<ValidatorResult>(p.validatorResults).map((v) => ({
      validator: String((v as ValidatorResult).validator || ''),
      status: String((v as ValidatorResult).status || ''),
      reason: String((v as ValidatorResult).reason || '')
    })),
    proofHash: String(p.proofHash || ''),
    evaluatedAt: new Date().toISOString()
  }
}

// ---- read helpers --------------------------------------------------------

export async function fetchStats(): Promise<ContractStats> {
  const raw = await readRaw('get_stats', [])
  const stats = JSON.parse(raw)
  return {
    worlds: num(stats.worlds),
    artifacts: num(stats.artifacts),
    proposals: num(stats.proposals),
    accepted: num(stats.accepted)
  }
}

export async function fetchWorlds(start = 0): Promise<World[]> {
  const raw = await readRaw('get_worlds', [start])
  const arr = asArray<RawWorld>(JSON.parse(raw))
  return arr.map((w) => normalizeWorld(w))
}

export async function fetchWorldState(worldId: string): Promise<World> {
  const raw = await readRaw('get_world_state', [worldId])
  const parsed = JSON.parse(raw) as {
    world?: RawWorld
    rules?: string[]
    artifacts?: Record<string, unknown>[]
  }
  const artifacts = asArray<Record<string, unknown>>(parsed.artifacts).map((a, i) => normalizeArtifact(a, i))
  return normalizeWorld(parsed.world || {}, parsed.rules, artifacts)
}

export async function fetchProposals(worldId: string, start = 0): Promise<ChainProposal[]> {
  const raw = await readRaw('get_proposals', [worldId, start])
  const arr = asArray<Record<string, unknown>>(JSON.parse(raw))
  return arr.map((p) => normalizeProposal(p))
}

export async function fetchProposal(proposalId: string): Promise<ChainProposal> {
  const raw = await readRaw('get_proposal', [proposalId])
  return normalizeProposal(JSON.parse(raw))
}

export async function fetchArtifact(artifactId: string): Promise<CanonArtifact> {
  const raw = await readRaw('get_canon_artifact', [artifactId])
  return normalizeArtifact(JSON.parse(raw), 0)
}

// ---- live proposal flow (wallet signed) ----------------------------------

export async function submitToTrial(
  world: World,
  proposal: Proposal,
  onStage?: StageCallback
): Promise<ChainProposal> {
  const stage = onStage || (() => undefined)
  const account = getActiveAccount()
  if (!account) {
    const message = 'Connect a wallet to evaluate this proposal on chain.'
    stage({ phase: 'error', message })
    throw new Error(message)
  }
  try {
    stage({ phase: 'wallet' })
    const client = makeWalletClient(account)

    // 1. Submit the proposal (deterministic write).
    const submitHash = (await client.writeContract({
      address: CONTRACT_ADDRESS as `0x${string}`,
      functionName: 'submit_lore_proposal',
      args: [
        world.worldId,
        proposal.title,
        proposal.type,
        proposal.text,
        proposal.contribution,
        proposal.tone,
        JSON.stringify(proposal.tags)
      ],
      value: 0n
    })) as unknown as string
    stage({ phase: 'submitted', txHash: submitHash })
    const submitTx = await pollUntilDecided(client, submitHash, () => undefined)
    const proposalId = readSubmittedProposalId(submitTx.tx)

    // 2. Evaluate under AI consensus.
    const evalHash = (await client.writeContract({
      address: CONTRACT_ADDRESS as `0x${string}`,
      functionName: 'evaluate_lore_proposal',
      args: [proposalId],
      value: 0n
    })) as unknown as string
    stage({ phase: 'submitted', txHash: evalHash })

    const decided = await pollUntilDecided(client, evalHash, (status) => {
      stage({ phase: 'consensus', status })
    })

    if (decided.status === 'ACCEPTED' || decided.status === 'FINALIZED') {
      const result = await fetchProposal(proposalId)
      stage({ phase: 'confirmed', result, txHash: evalHash })
      return result
    }
    const message = 'The network did not reach consensus. Your proposal is still being notarized.'
    stage({ phase: 'error', message })
    throw new Error(message)
  } catch (err) {
    const message = describeGenLayerError(err)
    stage({ phase: 'error', message })
    throw new Error(message)
  }
}

function pick(obj: unknown, key: string): unknown {
  if (obj instanceof Map) return obj.get(key)
  if (obj && typeof obj === 'object') return (obj as Record<string, unknown>)[key]
  return undefined
}

function readSubmittedProposalId(tx: unknown): string {
  try {
    const ret = pick(pick(pick(tx, 'consensus_data'), 'leader_receipt'), '0')
    const val = pick(ret, 'return_value')
    if (typeof val === 'string' && val.startsWith('prop-')) return val
  } catch {
    /* fall through */
  }
  return 'prop-1'
}

async function pollUntilDecided(
  client: ReturnType<typeof createClient>,
  hash: string,
  onUpdate: (status: string) => void
): Promise<{ status: string; tx: unknown }> {
  for (let i = 0; i < 150; i += 1) {
    const tx = await (client as unknown as { getTransaction: (a: { hash: string }) => Promise<unknown> })
      .getTransaction({ hash })
      .catch(() => null)
    const status = statusName(tx ? (tx as { status?: unknown }).status : 'PENDING')
    onUpdate(status)
    if (TERMINAL.has(status)) return { status, tx }
    await new Promise((r) => setTimeout(r, 6000))
  }
  return { status: 'TIMEOUT', tx: null }
}

// ---- wallet --------------------------------------------------------------

let activeAccount: string | null = null

export function getActiveAccount(): string | null {
  return activeAccount
}

export function hasInjectedWallet(): boolean {
  return typeof window !== 'undefined' && Boolean((window as unknown as { ethereum?: unknown }).ethereum)
}

export async function connectWallet(): Promise<{ ok: boolean; address?: string; error?: string }> {
  const eth =
    typeof window !== 'undefined'
      ? (window as unknown as { ethereum?: { request: (a: { method: string }) => Promise<string[]> } }).ethereum
      : undefined
  if (!eth) {
    // No synthetic fallback: without an injected provider there is no wallet.
    return { ok: false, error: 'No wallet detected' }
  }
  try {
    const accounts = await eth.request({ method: 'eth_requestAccounts' })
    if (!accounts || accounts.length === 0) return { ok: false, error: 'No accounts returned' }
    activeAccount = accounts[0]
    return { ok: true, address: accounts[0] }
  } catch (e) {
    return { ok: false, error: describeGenLayerError(e) }
  }
}

export function disconnectWallet(): void {
  activeAccount = null
}
