import { useCallback, useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate, Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Loader2, ArrowUpRight, Sparkles } from 'lucide-react'
import { CanonRuleRing } from '../components/trial/CanonRuleRing'
import { VerdictSeal } from '../components/trial/VerdictSeal'
import { EvidencePanel } from '../components/trial/EvidencePanel'
import { RevisionSuggestion } from '../components/trial/RevisionSuggestion'
import { ValidatorPassCard } from '../components/validators/ValidatorPassCard'
import { Gauge } from '../components/shared/Gauge'
import { ProofHashBadge } from '../components/shared/ProofHashBadge'
import { AssetImage } from '../components/shared/AssetImage'
import { LoadingCard, ErrorCard } from '../components/shared/ChainState'
import { useStore } from '../state/store'
import { useToast } from '../components/shared/Toast'
import { submitToTrial, type StageCallback, type TrialStage } from '../genlayer/genlayerClient'
import type { ChainProposal, Proposal } from '../types'
import { verdictLabel } from '../utils/formatters'

const DRAFT_KEY = 'lorebound.forge.draft.v1'

function readIncomingProposal(stateProposal: unknown): Proposal | null {
  if (stateProposal && typeof stateProposal === 'object' && 'title' in (stateProposal as object)) {
    return stateProposal as Proposal
  }
  try {
    const raw = sessionStorage.getItem(DRAFT_KEY)
    if (raw) return JSON.parse(raw) as Proposal
  } catch {
    /* ignore */
  }
  return null
}

export function ContinuityTrial() {
  const { world, proposals, loading, error, refresh, wallet, setTxInFlight } = useStore()
  const toast = useToast()
  const location = useLocation()
  const navigate = useNavigate()

  const incoming = readIncomingProposal((location.state as { proposal?: Proposal } | null)?.proposal)

  // Live submission state (only used when the user forges a new proposal).
  const [submitting, setSubmitting] = useState<Proposal | null>(incoming)
  const [stage, setStage] = useState<TrialStage | null>(null)
  const [liveResult, setLiveResult] = useState<ChainProposal | null>(null)
  const [running, setRunning] = useState(false)
  const startedFor = useRef<string | null>(null)

  // Which on-chain proposal is being inspected by default.
  const [selectedId, setSelectedId] = useState<string>('')
  useEffect(() => {
    if (!selectedId && proposals.length > 0) setSelectedId(proposals[0].proposalId)
  }, [proposals, selectedId])

  const onStage: StageCallback = useCallback((s) => {
    setStage(s)
    if (s.phase === 'confirmed') setLiveResult(s.result)
  }, [])

  const runTrial = useCallback(
    async (p: Proposal) => {
      if (!world) return
      setRunning(true)
      setLiveResult(null)
      setTxInFlight(true)
      try {
        const r = await submitToTrial(world, p, onStage)
        setLiveResult(r)
        toast.push('success', `${r.title}: ${verdictLabel(r.verdict)}`)
      } catch (e) {
        toast.push('error', e instanceof Error ? e.message : 'The trial could not complete.')
      } finally {
        setRunning(false)
        setTxInFlight(false)
      }
    },
    [world, onStage, toast, setTxInFlight]
  )

  useEffect(() => {
    if (submitting && startedFor.current !== submitting.proposalId) {
      startedFor.current = submitting.proposalId
      void runTrial(submitting)
    }
  }, [submitting, runTrial])

  if (loading && !world) return <LoadingCard label="Entering the Continuity Trial" />
  if (!world) return <ErrorCard message={error || 'No world is published on chain yet.'} onRetry={refresh} />

  // The record currently shown: a live run result, otherwise a selected chain proposal.
  const selectedChain = proposals.find((p) => p.proposalId === selectedId) || proposals[0] || null
  const result: ChainProposal | null = submitting ? liveResult : selectedChain
  const headingProposal = submitting || selectedChain

  // ---- Live submission view (forged proposal mid-consensus) --------------
  if (submitting) {
    const phase = stage?.phase
    const statusText =
      phase === 'wallet'
        ? 'Awaiting wallet signature'
        : phase === 'submitted'
          ? 'Submitted to the chamber'
          : phase === 'consensus'
            ? `Validators deliberating (${stage && 'status' in stage ? stage.status : ''})`
            : phase === 'confirmed'
              ? 'Consensus reached'
              : phase === 'error'
                ? 'The run was interrupted'
                : 'Preparing the trial'

    return (
      <div className="space-y-8">
        <header className="flex flex-col gap-3">
          <span className="eyebrow">Continuity Trial</span>
          <h1 className="myth-title text-4xl text-bone sm:text-5xl">{submitting.title}</h1>
          <div className="flex flex-wrap items-center gap-2 text-[12px] text-bone/55">
            <span className="rune-chip">{submitting.type}</span>
            <span className="rune-chip">Tone: {submitting.tone}</span>
            <span className="rune-chip">Live Bradbury consensus</span>
          </div>
        </header>

        <div className="grid gap-6 lg:grid-cols-2">
          <div className="bezel">
            <div className="bezel-core relative overflow-hidden p-6">
              <AssetImage src="/assets/trial-bg.webp" alt="" className="absolute inset-0 h-full w-full object-cover opacity-25" />
              <div className="absolute inset-0" style={{ background: 'radial-gradient(circle at 50% 50%, rgba(7,7,19,0.2), rgba(7,7,19,0.9))' }} />
              <div className="relative">
                <CanonRuleRing rules={world.rules} contradicted={[]} centerLabel={submitting.title} />
              </div>
            </div>
          </div>

          <div className="bezel">
            <div className="bezel-core flex flex-col items-center justify-center gap-5 p-8">
              <AnimatePresence mode="wait">
                {running || !liveResult ? (
                  <motion.div
                    key="running"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex flex-col items-center gap-4 py-10 text-center"
                  >
                    <Loader2 size={40} color="var(--rune-cyan)" className="animate-spin" />
                    <p className="myth-title text-lg text-bone">{statusText}</p>
                    {stage && 'txHash' in stage && stage.txHash ? (
                      <ProofHashBadge hash={stage.txHash} label="Tx" />
                    ) : null}
                    {stage && stage.phase === 'error' ? (
                      <p className="text-[12px]" style={{ color: 'var(--danger-ruby)' }}>
                        {stage.message}
                      </p>
                    ) : null}
                    <div className="flex gap-2 pt-2">
                      <button type="button" onClick={() => navigate('/forge')} className="cta cta-ghost !px-4 !py-2 text-sm">
                        Back to Forge
                      </button>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    key="verdict"
                    initial={{ opacity: 0, scale: 0.96 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex w-full flex-col items-center gap-5"
                  >
                    <VerdictSeal verdict={liveResult.verdict} />
                    <p className="text-center text-sm text-bone/70">{liveResult.reason}</p>
                    <div className="w-full">
                      <ProofHashBadge hash={liveResult.proofHash} label="Decision proof" />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {liveResult ? <TrialResult result={liveResult} /> : null}

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => {
              setSubmitting(null)
              startedFor.current = null
              setStage(null)
              setLiveResult(null)
            }}
            className="cta cta-ghost"
          >
            Browse on-chain trials
            <span className="cta-icon">
              <ArrowUpRight size={15} />
            </span>
          </button>
          <button type="button" onClick={() => navigate('/forge')} className="cta cta-ghost">
            Forge another
            <span className="cta-icon">
              <Sparkles size={15} />
            </span>
          </button>
        </div>
        <p className="sr-only">{wallet ? 'Wallet connected' : 'No wallet connected'}</p>
      </div>
    )
  }

  // ---- Default view: the real proposals on chain -------------------------
  if (proposals.length === 0) {
    return (
      <div className="space-y-8">
        <header className="flex flex-col gap-3">
          <span className="eyebrow">The most important chamber</span>
          <h1 className="myth-title text-4xl text-bone sm:text-5xl">Continuity Trial</h1>
        </header>
        <ErrorCard message={error || 'No proposals are recorded on chain for this world yet.'} onRetry={refresh} />
        <Link to="/forge" className="cta cta-ghost">
          Forge a proposal
          <span className="cta-icon">
            <Sparkles size={15} />
          </span>
        </Link>
      </div>
    )
  }

  const contradicted = result && result.verdict === 'REJECTED'
    ? result.evidence.map((e) => e.canonRule)
    : []

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-3">
        <span className="eyebrow">Continuity Trial</span>
        <h1 className="myth-title text-4xl text-bone sm:text-5xl">{headingProposal?.title || 'Continuity Trial'}</h1>
        <div className="flex flex-wrap items-center gap-2 text-[12px] text-bone/55">
          {result ? <span className="rune-chip">{result.type}</span> : null}
          {result ? <span className="rune-chip">Tone: {result.tone}</span> : null}
          <span className="rune-chip">Live Bradbury</span>
        </div>
      </header>

      {/* selector across the real proposals */}
      <div className="flex flex-wrap gap-2">
        {proposals.map((p) => (
          <button
            key={p.proposalId}
            type="button"
            onClick={() => setSelectedId(p.proposalId)}
            className={`rune-chip ${selectedId === p.proposalId ? 'border-rune text-bone' : 'hover:border-rune'}`}
            title={p.title}
          >
            {p.title} {'\u00b7'} {verdictLabel(p.verdict)}
          </button>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="bezel">
          <div className="bezel-core relative overflow-hidden p-6">
            <AssetImage src="/assets/trial-bg.webp" alt="" className="absolute inset-0 h-full w-full object-cover opacity-25" />
            <div className="absolute inset-0" style={{ background: 'radial-gradient(circle at 50% 50%, rgba(7,7,19,0.2), rgba(7,7,19,0.9))' }} />
            <div className="relative">
              <CanonRuleRing rules={world.rules} contradicted={contradicted} centerLabel={headingProposal?.title || world.name} />
            </div>
          </div>
        </div>

        <div className="bezel">
          <div className="bezel-core flex flex-col items-center justify-center gap-5 p-8">
            {result ? (
              <motion.div
                key={result.proposalId}
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex w-full flex-col items-center gap-5"
              >
                <VerdictSeal verdict={result.verdict} />
                <p className="text-center text-sm text-bone/70">{result.reason}</p>
                <div className="w-full">
                  <ProofHashBadge hash={result.proofHash} label="Decision proof" />
                </div>
              </motion.div>
            ) : null}
          </div>
        </div>
      </div>

      {result ? <TrialResult result={result} /> : null}

      <div className="flex flex-wrap gap-3">
        <Link to="/constellation" className="cta cta-ghost">
          See the world impact
          <span className="cta-icon">
            <ArrowUpRight size={15} />
          </span>
        </Link>
        <button type="button" onClick={() => navigate('/forge')} className="cta cta-ghost">
          Forge your own
          <span className="cta-icon">
            <Sparkles size={15} />
          </span>
        </button>
      </div>
      <p className="sr-only">{wallet ? 'Wallet connected' : 'No wallet connected'}</p>
    </div>
  )
}

function TrialResult({ result }: { result: ChainProposal }) {
  return (
    <>
      <section className="bezel">
        <div className="bezel-core grid gap-6 p-6 sm:grid-cols-2 lg:grid-cols-4">
          <Gauge label="Canon Fit" value={result.canonFitScore} color="var(--success-mint)" hint="Sits inside the rules." />
          <Gauge label="Continuity Risk" value={result.continuityRisk} color="var(--rune-cyan)" invert hint="Tension with canon." />
          <Gauge label="Originality" value={result.originalityScore} color="var(--myth-gold)" hint="Adds something new." />
          <Gauge label="Tone Match" value={result.toneMatch} color="var(--spirit-blue)" hint="Speaks the world voice." />
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="bezel">
          <div className="bezel-core p-6">
            <h2 className="myth-title text-xl text-bone">Evidence used</h2>
            <p className="mt-1 text-[12px] text-bone/50">Every citation resolves to a real canon rule read from chain.</p>
            <div className="mt-4">
              <EvidencePanel evidence={result.evidence} />
            </div>
            {result.suggestedRevision ? (
              <div className="mt-4">
                <RevisionSuggestion text={result.suggestedRevision} />
              </div>
            ) : null}
          </div>
        </div>

        <div className="bezel">
          <div className="bezel-core p-6">
            <div className="flex items-center justify-between">
              <h2 className="myth-title text-xl text-bone">Validator layers</h2>
              <Link to="/validators" className="ink-link inline-flex items-center gap-1 text-sm">
                Full chamber <ArrowUpRight size={14} />
              </Link>
            </div>
            <p className="mt-1 text-[12px] text-bone/50">Each layer reached its own ruling on chain.</p>
            <div className="mt-4 space-y-2.5">
              {result.validatorResults.length > 0 ? (
                result.validatorResults.map((v, i) => (
                  <ValidatorPassCard key={`${v.validator}-${i}`} result={v} index={i} />
                ))
              ) : (
                <p className="text-sm text-bone/45">
                  This proposal carries no separate validator records. The evidence and reason above are the
                  recorded basis for its verdict.
                </p>
              )}
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
