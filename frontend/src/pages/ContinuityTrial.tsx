import { useCallback, useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate, Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Loader2, ArrowUpRight, Sparkles, ShieldCheck } from 'lucide-react'
import { CanonRuleRing } from '../components/trial/CanonRuleRing'
import { VerdictSeal } from '../components/trial/VerdictSeal'
import { EvidencePanel } from '../components/trial/EvidencePanel'
import { RevisionSuggestion } from '../components/trial/RevisionSuggestion'
import { ValidatorPassCard } from '../components/validators/ValidatorPassCard'
import { Gauge } from '../components/shared/Gauge'
import { ProofHashBadge } from '../components/shared/ProofHashBadge'
import { AssetImage } from '../components/shared/AssetImage'
import { useStore } from '../state/store'
import { useToast } from '../components/shared/Toast'
import { submitToTrial } from '../genlayer/genlayerClient'
import type { StageCallback, TrialStage } from '../genlayer/mockGenLayer'
import type { EvaluationResult, Proposal } from '../types'
import { DEMO_PROPOSALS } from '../data/demoProposals'

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
  const { world, recordTrial, acceptArtifact, settings, wallet } = useStore()
  const toast = useToast()
  const location = useLocation()
  const navigate = useNavigate()

  const incoming = readIncomingProposal((location.state as { proposal?: Proposal } | null)?.proposal)
  const [proposal, setProposal] = useState<Proposal | null>(incoming)
  const [stage, setStage] = useState<TrialStage | null>(null)
  const [result, setResult] = useState<EvaluationResult | null>(null)
  const [running, setRunning] = useState(false)
  const [accepted, setAccepted] = useState(false)
  const startedFor = useRef<string | null>(null)

  const onStage: StageCallback = useCallback((s) => {
    setStage(s)
    if (s.phase === 'confirmed') setResult(s.result)
  }, [])

  const runTrial = useCallback(
    async (p: Proposal) => {
      setRunning(true)
      setResult(null)
      setAccepted(false)
      try {
        const r = await submitToTrial(world, p, onStage)
        setResult(r)
        recordTrial(r, p)
      } catch (e) {
        toast.push('error', e instanceof Error ? e.message : 'The trial could not complete.')
      } finally {
        setRunning(false)
      }
    },
    [world, onStage, recordTrial, toast]
  )

  useEffect(() => {
    if (proposal && startedFor.current !== proposal.proposalId) {
      startedFor.current = proposal.proposalId
      void runTrial(proposal)
    }
  }, [proposal, runTrial])

  const loadDemoAndRun = (id: string) => {
    const demo = DEMO_PROPOSALS.find((d) => d.proposalId === id)
    if (!demo) return
    const p: Proposal = { ...demo, proposalId: `${demo.proposalId}-${Date.now().toString(36)}` }
    setProposal(p)
  }

  const onAccept = () => {
    if (!result || !proposal) return
    acceptArtifact(result, proposal)
    setAccepted(true)
    toast.push('success', `${proposal.title} entered the canon.`)
  }

  if (!proposal) {
    return (
      <div className="space-y-8">
        <header className="flex flex-col gap-3">
          <span className="eyebrow">The most important chamber</span>
          <h1 className="myth-title text-4xl text-bone sm:text-5xl">Continuity Trial</h1>
          <p className="max-w-2xl text-[15px] text-bone/60">
            Bring a proposal here from the Forge, or summon a demo case to watch the canon judge it in real
            time.
          </p>
        </header>
        <div className="bezel">
          <div className="bezel-core grid gap-4 p-8 sm:grid-cols-2 lg:grid-cols-3">
            {DEMO_PROPOSALS.map((d) => (
              <button
                key={d.proposalId}
                type="button"
                onClick={() => loadDemoAndRun(d.proposalId)}
                className="glass-panel p-4 text-left transition-colors hover:border-rune"
              >
                <span className="rune-chip">{d.label}</span>
                <h3 className="myth-title mt-2 text-lg text-bone">{d.title}</h3>
                <p className="mt-1 text-[12px] text-bone/55">{d.blurb}</p>
              </button>
            ))}
          </div>
        </div>
        <Link to="/forge" className="cta cta-ghost">
          Forge your own
          <span className="cta-icon">
            <Sparkles size={15} />
          </span>
        </Link>
      </div>
    )
  }

  const contradictions = result?.contradictions || []
  const phase = stage?.phase
  const statusText =
    phase === 'wallet'
      ? settings.genlayerMode === 'mock'
        ? 'Sealing the proposal'
        : 'Awaiting wallet signature'
      : phase === 'submitted'
        ? 'Submitted to the chamber'
        : phase === 'consensus'
          ? `Validators deliberating (${stage && 'status' in stage ? stage.status : ''})`
          : phase === 'confirmed'
            ? 'Consensus reached'
            : ''

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-3">
        <span className="eyebrow">Continuity Trial</span>
        <h1 className="myth-title text-4xl text-bone sm:text-5xl">{proposal.title}</h1>
        <div className="flex flex-wrap items-center gap-2 text-[12px] text-bone/55">
          <span className="rune-chip">{proposal.type}</span>
          <span className="rune-chip">Tone: {proposal.tone}</span>
          <span className="rune-chip">{settings.genlayerMode === 'mock' ? 'Mock GenLayer' : 'Live Bradbury'}</span>
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* the stage: rules orbiting the proposal */}
        <div className="bezel">
          <div className="bezel-core relative overflow-hidden p-6">
            <AssetImage src="/assets/trial-bg.webp" alt="" className="absolute inset-0 h-full w-full object-cover opacity-25" />
            <div className="absolute inset-0" style={{ background: 'radial-gradient(circle at 50% 50%, rgba(7,7,19,0.2), rgba(7,7,19,0.9))' }} />
            <div className="relative">
              <CanonRuleRing rules={world.rules} contradicted={contradictions} centerLabel={proposal.title} />
            </div>
          </div>
        </div>

        {/* verdict + status */}
        <div className="bezel">
          <div className="bezel-core flex flex-col items-center justify-center gap-5 p-8">
            <AnimatePresence mode="wait">
              {running || !result ? (
                <motion.div
                  key="running"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex flex-col items-center gap-4 py-10 text-center"
                >
                  <Loader2 size={40} color="var(--rune-cyan)" className="animate-spin" />
                  <p className="myth-title text-lg text-bone">{statusText || 'Preparing the trial'}</p>
                  {stage && 'txHash' in stage && stage.txHash ? (
                    <ProofHashBadge hash={stage.txHash} label="Tx" />
                  ) : null}
                  {stage && stage.phase === 'consensus' && 'draft' in stage && stage.draft?.verdict ? (
                    <p className="text-[12px] text-bone/50">Leader leaning toward {stage.draft.verdict}</p>
                  ) : null}
                </motion.div>
              ) : (
                <motion.div
                  key="verdict"
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex w-full flex-col items-center gap-5"
                >
                  <VerdictSeal verdict={result.verdict} />
                  <p className="text-center text-sm text-bone/70">{result.reason}</p>
                  <div className="w-full">
                    <ProofHashBadge hash={result.proofHash} label="Decision proof" />
                  </div>
                  {result.verdict === 'ACCEPTED' ? (
                    <button
                      type="button"
                      onClick={onAccept}
                      disabled={accepted}
                      className="cta cta-primary w-full justify-center disabled:opacity-50"
                    >
                      {accepted ? 'Added to the canon' : 'Add to the canon'}
                      <span className="cta-icon">
                        <ShieldCheck size={15} />
                      </span>
                    </button>
                  ) : null}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* metrics + evidence + validators */}
      {result ? (
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
                <p className="mt-1 text-[12px] text-bone/50">Every citation resolves to a real canon rule or artifact.</p>
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
                <p className="mt-1 text-[12px] text-bone/50">Each layer reaches its own ruling, not a field check.</p>
                <div className="mt-4 space-y-2.5">
                  {result.validatorResults.map((v, i) => (
                    <ValidatorPassCard key={`${v.validator}-${i}`} result={v} index={i} />
                  ))}
                </div>
              </div>
            </div>
          </section>

          <div className="flex flex-wrap gap-3">
            <Link to="/constellation" className="cta cta-ghost">
              See the world impact
              <span className="cta-icon">
                <ArrowUpRight size={15} />
              </span>
            </Link>
            <button type="button" onClick={() => navigate('/forge')} className="cta cta-ghost">
              Forge another
              <span className="cta-icon">
                <Sparkles size={15} />
              </span>
            </button>
          </div>
        </>
      ) : null}
      <p className="sr-only">{wallet ? 'Wallet connected' : 'No wallet connected'}</p>
    </div>
  )
}
