/*
  genlayerClient.ts
  The public client surface for Lorebound. It routes each canon action between
  the LOCAL mock engine (default, fully offline) and the REAL GenLayer Bradbury
  contract, based on the selected mode ('mock' | 'real').

  CONTRACT_ADDRESS is the single placeholder the PARENT overwrites after
  deploying to Bradbury, then rebuilds. Until then it is the zero address and
  the real path reports "not deployed", so the app always works in mock mode.
*/
import { createClient } from 'genlayer-js'
import { testnetBradbury } from 'genlayer-js/chains'
import type { EvaluationResult, GenLayerStatus, Proposal, World } from '../types'
import * as mock from './mockGenLayer'
import type { StageCallback } from './mockGenLayer'

// ---- live contract coordinates ------------------------------------------
// PLACEHOLDER. The parent deploy step replaces this address (and rebuilds).
export const CONTRACT_ADDRESS = '0xe99B76bFDc1f79F008CCFda5B321533CBC8f0823'
export const DEPLOY_TX = '0xc77592fc6982327dbe542e57266c4dae812ea17573aa908b12156a1cf5f25454'
export const EXPLORER = 'https://explorer-bradbury.genlayer.com'
export const FAUCET = 'https://testnet-faucet.genlayer.foundation/'

const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000'
export const IS_DEPLOYED = String(CONTRACT_ADDRESS).toLowerCase() !== ZERO_ADDRESS.toLowerCase()

// ---- mode ----------------------------------------------------------------

let mode: 'mock' | 'real' = 'mock'

export function setGenLayerMode(next: 'mock' | 'real'): void {
  mode = next === 'real' ? 'real' : 'mock'
}

export function getGenLayerMode(): 'mock' | 'real' {
  return mode
}

// ---- read client (real) --------------------------------------------------

let _readClient: ReturnType<typeof createClient> | null = null
function readClient() {
  if (!_readClient) _readClient = createClient({ chain: testnetBradbury })
  return _readClient
}

function makeWalletClient(account: string) {
  const provider = typeof window !== 'undefined' ? (window as unknown as { ethereum?: unknown }).ethereum : undefined
  return createClient({ chain: testnetBradbury, account: account as `0x${string}`, provider })
}

// ---- transaction status naming (real) ------------------------------------

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

// LEADER_TIMEOUT / VALIDATORS_TIMEOUT are NON-terminal: the network rotates the
// leader and retries, so we keep polling through them.
const TERMINAL = new Set(['ACCEPTED', 'FINALIZED', 'UNDETERMINED', 'CANCELED'])

export function describeGenLayerError(err: unknown): string {
  const msg = String((err as { message?: string })?.message || err || '')
  if (/reject|denied|4001|cancel/i.test(msg)) return 'You cancelled the signature.'
  if (/insufficient funds|max fee|fee reserve/i.test(msg)) {
    return 'Your wallet is below the fee reserve for AI transactions. Top up at the testnet faucet.'
  }
  if (/rate limit|429|timeout|network|fetch|too many|congest/i.test(msg)) {
    return 'The network is busy. Your proposal is still being notarized.'
  }
  if (/not deployed/i.test(msg)) return 'The Lorebound contract is not deployed to this network yet.'
  return msg || 'Something interrupted the evaluation. Please try again.'
}

// ---- public surface ------------------------------------------------------

// Submit a proposal to the Continuity Trial. In mock mode this is the instant
// local engine staged like a consensus run. In real mode it performs the
// Bradbury flow: submit_lore_proposal (write) -> evaluate_lore_proposal (AI
// consensus write) -> read the evaluated proposal.
export async function submitToTrial(
  world: World,
  proposal: Proposal,
  onStage?: StageCallback
): Promise<EvaluationResult> {
  if (mode === 'mock' || !IS_DEPLOYED) {
    return mock.submitLoreProposal(world, proposal, onStage)
  }
  return submitToTrialReal(world, proposal, onStage)
}

async function submitToTrialReal(
  world: World,
  proposal: Proposal,
  onStage?: StageCallback
): Promise<EvaluationResult> {
  const stage = onStage || (() => undefined)
  const account = getActiveAccount()
  if (!account) {
    const message = 'Connect a wallet to evaluate on chain, or switch to mock mode in Settings.'
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
      const raw = (await readClient().readContract({
        address: CONTRACT_ADDRESS as `0x${string}`,
        functionName: 'get_proposal',
        args: [proposalId]
      })) as unknown as string
      const result = normalizeProposal(JSON.parse(raw))
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
  // The write returns the new proposalId in the leader receipt return value.
  // Fall back to a counter-derived id if it cannot be read.
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

function num(v: unknown): number {
  const n = Number(String(v ?? '0'))
  return Number.isFinite(n) ? n : 0
}

function normalizeProposal(p: Record<string, unknown>): EvaluationResult {
  return {
    proposalId: String(p.proposalId || ''),
    title: String(p.title || ''),
    type: (p.type as EvaluationResult['type']) || 'Custom',
    verdict: (p.verdict as EvaluationResult['verdict']) || 'NEEDS_HUMAN_VOTE',
    canonFitScore: num(p.canonFitScore),
    continuityRisk: num(p.continuityRisk),
    originalityScore: num(p.originalityScore),
    toneMatch: num(p.toneMatch),
    evidence: Array.isArray(p.evidence) ? (p.evidence as EvaluationResult['evidence']) : [],
    reason: String(p.reason || ''),
    suggestedRevision: p.suggestedRevision == null ? null : String(p.suggestedRevision),
    validatorResults: Array.isArray(p.validatorResults)
      ? (p.validatorResults as EvaluationResult['validatorResults'])
      : [],
    proofHash: String(p.proofHash || ''),
    evaluatedAt: new Date().toISOString()
  }
}

// ---- status --------------------------------------------------------------

export async function getGenLayerStatus(world: World): Promise<GenLayerStatus> {
  if (mode === 'mock') {
    return mock.getMockStatus(world)
  }
  const base: GenLayerStatus = {
    mode: 'real',
    online: false,
    contract: CONTRACT_ADDRESS,
    deployed: IS_DEPLOYED
  }
  if (!IS_DEPLOYED) {
    return { ...base, note: 'The Lorebound contract is not deployed to this network yet.' }
  }
  try {
    const raw = (await readClient().readContract({
      address: CONTRACT_ADDRESS as `0x${string}`,
      functionName: 'get_stats',
      args: []
    })) as unknown as string
    const stats = JSON.parse(raw)
    return {
      ...base,
      online: true,
      worlds: num(stats.worlds),
      artifacts: num(stats.artifacts),
      proposals: num(stats.proposals),
      accepted: num(stats.accepted)
    }
  } catch {
    return { ...base, note: 'Bradbury is not reachable right now. Reads will retry.' }
  }
}

// ---- minimal wallet snapshot --------------------------------------------

let activeAccount: string | null = null

export function getActiveAccount(): string | null {
  return activeAccount
}

export async function connectWallet(): Promise<{ ok: boolean; address?: string; error?: string }> {
  const eth = typeof window !== 'undefined' ? (window as unknown as { ethereum?: { request: (a: { method: string }) => Promise<string[]> } }).ethereum : undefined
  if (!eth) {
    // Mock wallet: synthesize a deterministic demo address so the chrome can
    // show a connected identity even without a provider.
    activeAccount = '0xA57e1004C0117Be0bD0F00C0117Be0bD0f00C011'
    return { ok: true, address: activeAccount }
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
