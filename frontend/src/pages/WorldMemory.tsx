import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { Sparkles } from 'lucide-react'
import { WorldMemoryTimeline, trialToEntry, type TimelineEntry } from '../components/artifacts/WorldMemoryTimeline'
import { AssetImage } from '../components/shared/AssetImage'
import { EmptyState } from '../components/shared/EmptyState'
import { useStore } from '../state/store'

export function WorldMemory() {
  const { world, trials } = useStore()

  const entries = useMemo<TimelineEntry[]>(() => {
    const seeds: TimelineEntry[] = world.artifacts
      .filter((a) => a.sourceProposal === 'seed')
      .map((a) => ({
        id: a.artifactId,
        title: a.title,
        verdict: 'SEED',
        date: a.acceptedDate,
        detail: a.summary,
        type: a.type
      }))
    const trialEntries = trials.map(trialToEntry)
    const all = [...trialEntries, ...seeds]
    all.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    return all
  }, [world.artifacts, trials])

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
                The history of {world.name} as a flowing ribbon. Founding canon, accepted pieces, rejected
                fragments and revisions, in the order the world remembers them.
              </p>
            </div>
          </div>
        </div>
      </header>

      {entries.length === 0 ? (
        <EmptyState
          title="The world has no memory yet"
          body="Run a Continuity Trial and the verdict will be written into the timeline."
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
