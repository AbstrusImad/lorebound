import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Star, Unlink, AlertTriangle, ArrowUpRight } from 'lucide-react'
import { LivingAtlas } from '../components/atlas/LivingAtlas'
import { AssetImage } from '../components/shared/AssetImage'
import { LoadingCard, ErrorCard } from '../components/shared/ChainState'
import { useStore } from '../state/store'
import type { CanonArtifact, ChainProposal } from '../types'
import { verdictLabel, verdictColor } from '../utils/formatters'

// Shows how a real chain proposal affects the world. Accepted -> a new star
// joins the constellation; Rejected -> a broken fragment; Needs Revision -> an
// unstable fragment. Every value here is read from chain.

export function CanonConstellation() {
  const { world, proposals, loading, error, refresh } = useStore()
  const [selectedId, setSelectedId] = useState<string>('')

  useEffect(() => {
    if (!selectedId && proposals.length > 0) setSelectedId(proposals[0].proposalId)
  }, [proposals, selectedId])

  const preview = useMemo<ChainProposal | null>(
    () => proposals.find((p) => p.proposalId === selectedId) || proposals[0] || null,
    [selectedId, proposals]
  )

  const projected: CanonArtifact[] = useMemo(() => {
    if (!world) return []
    if (!preview || preview.verdict !== 'ACCEPTED') return world.artifacts
    const ghost: CanonArtifact = {
      artifactId: 'ghost-preview',
      worldId: world.worldId,
      title: preview.title,
      type: preview.type,
      summary: preview.reason,
      canonFitScore: preview.canonFitScore,
      proofHash: preview.proofHash,
      sourceProposal: preview.proposalId,
      accepted: preview.author,
      acceptedDate: '',
      x: 0.5,
      y: 0.5,
      connections: world.artifacts.slice(0, 2).map((a) => a.artifactId)
    }
    return [...world.artifacts, ghost]
  }, [preview, world])

  if (loading && !world) return <LoadingCard label="Plotting the Constellation" />
  if (!world) return <ErrorCard message={error || 'No world is published on chain yet.'} onRetry={refresh} />

  const color = preview ? verdictColor(preview.verdict) : 'var(--muted-silver)'

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-3">
        <span className="eyebrow">World impact</span>
        <h1 className="myth-title text-4xl text-bone sm:text-5xl">Canon Constellation</h1>
        <p className="max-w-2xl text-[15px] text-bone/60">
          See how each proposal changed the universe. Accepted lore ignites a new star. Rejected lore breaks
          apart. A revision hovers, unstable, until it is reconciled. Every verdict here is read from chain.
        </p>
      </header>

      {proposals.length === 0 ? (
        <ErrorCard message={error || 'No proposals are recorded on chain for this world yet.'} onRetry={refresh} />
      ) : (
        <>
          <div className="flex flex-wrap gap-2">
            {proposals.map((p) => (
              <button
                key={p.proposalId}
                type="button"
                onClick={() => setSelectedId(p.proposalId)}
                className={`rune-chip ${selectedId === p.proposalId ? 'border-rune text-bone' : 'hover:border-rune'}`}
                title={p.title}
              >
                {verdictLabel(p.verdict)}
              </button>
            ))}
          </div>

          <div className="grid gap-6 lg:grid-cols-5">
            <div className="bezel lg:col-span-3">
              <div className="bezel-core relative overflow-hidden">
                <AssetImage src="/assets/constellation-bg.webp" alt="" className="absolute inset-0 h-full w-full object-cover opacity-40" />
                <div className="absolute inset-0" style={{ background: 'radial-gradient(circle at 50% 50%, rgba(7,7,19,0.2), rgba(7,7,19,0.88))' }} />
                <LivingAtlas artifacts={projected} className="relative h-[420px] w-full sm:h-[500px]" />
                {preview && preview.verdict !== 'ACCEPTED' ? (
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
              {preview ? (
                <>
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

                  <Effect
                    title="Canon Fit"
                    body={`${preview.canonFitScore} / 100 fit inside the world rules.`}
                  />
                  <Effect
                    title="Continuity Risk"
                    body={`${preview.continuityRisk} / 100 tension with existing canon.`}
                  />
                  <Effect
                    title="Cited canon"
                    body={
                      preview.evidence.length > 0
                        ? preview.evidence.map((e) => e.canonRule).join('  ')
                        : 'No canon rule was cited for this verdict.'
                    }
                  />
                  <Effect
                    title="Future continuity"
                    body={
                      preview.verdict === 'ACCEPTED'
                        ? 'Strengthens the world and joins the constellation.'
                        : 'Held back until reconciled or reworked.'
                    }
                  />
                </>
              ) : null}

              <Link to="/trial" className="cta cta-ghost w-full justify-center">
                Open the full trial
                <span className="cta-icon">
                  <ArrowUpRight size={15} />
                </span>
              </Link>
            </div>
          </div>
        </>
      )}
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
