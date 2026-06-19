import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { Sparkles } from 'lucide-react'
import { WorldMemoryTimeline, type TimelineEntry } from '../components/artifacts/WorldMemoryTimeline'
import { AssetImage } from '../components/shared/AssetImage'
import { EmptyState } from '../components/shared/EmptyState'
import { LoadingCard, ErrorCard } from '../components/shared/ChainState'
import { useStore } from '../state/store'
import type { Verdict } from '../types'

export function WorldMemory() {
  const { world, proposals, loading, error, refresh } = useStore()

  const entries = useMemo<TimelineEntry[]>(() => {
    if (!world) return []
    // Accepted artifacts as canon events.
    const artifactEntries: TimelineEntry[] = world.artifacts.map((a) => ({
      id: `artifact-${a.artifactId}`,
      title: a.title,
      verdict: 'ACCEPTED' as Verdict,
      date: a.acceptedDate,
      detail: a.summary,
      type: a.type
    }))
    // Proposal verdicts (accepted / rejected / revision) as ruling events.
    const proposalEntries: TimelineEntry[] = proposals.map((p, i) => ({
      id: `proposal-${p.proposalId}`,
      title: p.title,
      verdict: p.verdict || ('' as Verdict),
      // Chain order: earlier proposalIds are older events.
      date: String(proposals.length - i),
      detail: p.reason || p.contribution || p.text.slice(0, 160),
      type: p.type
    }))
    // Keep chain order: proposals first (newest ruling at top), then artifacts.
    return [...proposalEntries, ...artifactEntries]
  }, [world, proposals])

  if (loading && !world) return <LoadingCard label="Recalling the World Memory" />
  if (!world) return <ErrorCard message={error || 'No world is published on chain yet.'} onRetry={refresh} />

  return (
    <div className="space-y-8">
      <header className="relative">
        <div className="bezel overflow-hidden">
          <div className="bezel-core relative overflow-hidden p-8 sm:p-12">
            <AssetImage src="/assets/memory-bg.webp" alt="" className="absolute inset-0 h-full w-full object-cover opacity-45" />
            <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, rgba(7,7,19,0.4), rgba(7,7,19,0.85))' }} />
            <div className="relative">
              <span className="eyebrow">The river of time</span>
              <h1 className="myth-title mt-3 text-4xl text-bone sm:text-5xl">World Memory</h1>
              <p className="mt-3 max-w-2xl text-[15px] text-bone/65">
                The history of {world.name} as a flowing ribbon. Accepted canon, accepted proposals and
                rejected fragments, in the order the chain remembers them.
              </p>
            </div>
          </div>
        </div>
      </header>

      {entries.length === 0 ? (
        <EmptyState
          title="The world has no memory yet"
          body="When a proposal is judged on chain, its verdict joins the timeline."
          action={
            <Link to="/forge" className="cta cta-ghost mt-2">
              Forge a proposal
              <span className="cta-icon">
                <Sparkles size={15} />
              </span>
            </Link>
          }
        />
      ) : (
        <div className="bezel">
          <div className="bezel-core p-6 sm:p-10">
            <WorldMemoryTimeline entries={entries} />
          </div>
        </div>
      )}
    </div>
  )
}
