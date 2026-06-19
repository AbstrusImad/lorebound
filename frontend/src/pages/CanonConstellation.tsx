import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Star, Unlink, AlertTriangle, ArrowUpRight } from 'lucide-react'
import { LivingAtlas } from '../components/atlas/LivingAtlas'
import { AssetImage } from '../components/shared/AssetImage'
import { useStore } from '../state/store'
import type { CanonArtifact, EvaluationResult } from '../types'
import { evaluateLoreProposal } from '../utils/localCanonEngine'
import { DEMO_PROPOSALS } from '../data/demoProposals'
import { verdictLabel, verdictColor } from '../utils/formatters'

// Shows how a new piece would affect the world. Accepted -> a new star appears;
// Rejected -> a broken fragment; Needs Revision -> an unstable fragment.

export function CanonConstellation() {
  const { world, trials } = useStore()
  const [selectedId, setSelectedId] = useState<string>(
    DEMO_PROPOSALS[0].proposalId
  )

  const preview = useMemo<EvaluationResult>(() => {
    const fromTrial = trials.find((t) => t.proposalId === selectedId)
    if (fromTrial) return fromTrial
    const demo = DEMO_PROPOSALS.find((d) => d.proposalId === selectedId) || DEMO_PROPOSALS[0]
    return evaluateLoreProposal(world, demo)
  }, [selectedId, trials, world])

  const projected: CanonArtifact[] = useMemo(() => {
    if (preview.verdict !== 'ACCEPTED') return world.artifacts
    const ghost: CanonArtifact = {
      artifactId: 'ghost-preview',
      worldId: world.worldId,
      title: preview.title,
      type: preview.type,
      summary: preview.reason,
      canonFitScore: preview.canonFitScore,
      proofHash: preview.proofHash,
      sourceProposal: preview.proposalId,
      accepted: 'Preview',
      acceptedDate: new Date().toISOString().slice(0, 10),
      x: 0.5,
      y: 0.5,
      connections: world.artifacts.slice(0, 2).map((a) => a.artifactId)
    }
    return [...world.artifacts, ghost]
  }, [preview, world])

  const options = useMemo(() => {
    const demoOpts = DEMO_PROPOSALS.map((d) => ({ id: d.proposalId, label: d.label, title: d.title }))
    const trialOpts = trials.slice(0, 6).map((t) => ({ id: t.proposalId, label: verdictLabel(t.verdict), title: t.title }))
    return [...trialOpts, ...demoOpts]
  }, [trials])

  const color = verdictColor(preview.verdict)

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-3">
        <span className="eyebrow">World impact</span>
        <h1 className="myth-title text-4xl text-bone sm:text-5xl">Canon Constellation</h1>
        <p className="max-w-2xl text-[15px] text-bone/60">
          See how a piece would change the universe before it is sealed. Accepted lore ignites a new star.
          Rejected lore breaks apart. A revision hovers, unstable, until it is reconciled.
        </p>
      </header>

      <div className="flex flex-wrap gap-2">
        {options.map((o) => (
          <button
            key={o.id}
            type="button"
            onClick={() => setSelectedId(o.id)}
            className={`rune-chip ${selectedId === o.id ? 'border-rune text-bone' : 'hover:border-rune'}`}
            title={o.title}
          >
            {o.label}
          </button>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        <div className="bezel lg:col-span-3">
          <div className="bezel-core relative overflow-hidden">
            <AssetImage src="/assets/constellation-bg.webp" alt="" className="absolute inset-0 h-full w-full object-cover opacity-40" />
            <div className="absolute inset-0" style={{ background: 'radial-gradient(circle at 50% 50%, rgba(7,7,19,0.2), rgba(7,7,19,0.88))' }} />
            <LivingAtlas artifacts={projected} className="relative h-[420px] w-full sm:h-[500px]" />
            {preview.verdict !== 'ACCEPTED' ? (
              <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-center">
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="flex flex-col items-center gap-2"
                >
                  {preview.verdict === 'REJECTED' ? (
                    <Unlink size={36} color={color} />
                  ) : (
                    <AlertTriangle size={36} color={color} />
                  )}
                  <span className="myth-title text-sm" style={{ color }}>
                    {preview.verdict === 'REJECTED' ? 'Broken fragment' : 'Unstable fragment'}
                  </span>
                </motion.div>
              </div>
            ) : null}
          </div>
        </div>

        <div className="space-y-5 lg:col-span-2">
          <div className="bezel">
            <div className="bezel-core p-6">
              <div className="flex items-center gap-2">
                <Star size={16} color={color} />
                <h2 className="myth-title text-xl text-bone">{preview.title}</h2>
              </div>
              <p className="mt-1 text-sm" style={{ color }}>
                {verdictLabel(preview.verdict)}
              </p>
              <p className="mt-3 text-[13px] text-bone/65">{preview.reason}</p>
            </div>
          </div>

          <Effect title="New connections" body={preview.verdict === 'ACCEPTED' ? `Would wire to ${Math.min(2, world.artifacts.length)} existing canon pieces.` : 'No new connections would form.'} />
          <Effect title="Impacted rules" body={preview.contradictions && preview.contradictions.length > 0 ? preview.contradictions.join('  ') : 'No canon rule is disturbed.'} />
          <Effect title="Related artifacts" body={preview.similarTo && preview.similarTo.length > 0 ? `Closest: ${preview.similarTo.join(', ')}` : 'No close artifact in the canon.'} />
          <Effect title="Future continuity" body={preview.verdict === 'ACCEPTED' ? 'Strengthens the world without tension.' : 'Held back until reconciled or reworked.'} />

          <Link to="/trial" className="cta cta-ghost w-full justify-center">
            Run the full trial
            <span className="cta-icon">
              <ArrowUpRight size={15} />
            </span>
          </Link>
        </div>
      </div>
    </div>
  )
}

function Effect({ title, body }: { title: string; body: string }) {
  return (
    <div className="glass-panel p-4">
      <p className="text-[10px] uppercase tracking-[0.18em] text-rune">{title}</p>
      <p className="mt-1 text-[13px] text-bone/75">{body}</p>
    </div>
  )
}
