import { useState } from 'react'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { Link2, ArrowUpRight, X } from 'lucide-react'
import { LivingAtlas } from '../components/atlas/LivingAtlas'
import { AssetImage } from '../components/shared/AssetImage'
import { ProofHashBadge } from '../components/shared/ProofHashBadge'
import { LoadingCard, ErrorCard } from '../components/shared/ChainState'
import { useStore } from '../state/store'
import type { CanonArtifact } from '../types'
import { formatDate } from '../utils/formatters'

const TYPE_COLOR: Record<string, string> = {
  Character: '#FF6B9A',
  Location: '#74EBD5',
  Relic: '#F4C95D',
  Creature: '#66E6A3',
  Faction: '#5C8DFF',
  Event: '#F4C95D',
  'Magic Rule': '#74EBD5',
  Technology: '#9EA7B8',
  Custom: '#F5EBDD'
}

export function CanonAtlas() {
  const { world, loading, error, refresh } = useStore()
  const [selected, setSelected] = useState<CanonArtifact | null>(null)

  if (loading && !world) return <LoadingCard label="Charting the Canon Atlas" />
  if (!world) return <ErrorCard message={error || 'No world is published on chain yet.'} onRetry={refresh} />

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-3">
        <span className="eyebrow">The living atlas</span>
        <h1 className="myth-title text-4xl text-bone sm:text-5xl">Canon Atlas</h1>
        <p className="max-w-2xl text-[15px] text-bone/60">
          The universe of {world.name} drawn as a constellation. Each star is an accepted canon piece. The
          threads are the connections between them. Tap a node to read its lineage.
        </p>
      </header>

      <div className="relative">
        <div className="bezel overflow-hidden">
          <div className="bezel-core relative overflow-hidden">
            <AssetImage
              src="/assets/atlas-bg.webp"
              alt=""
              className="absolute inset-0 h-full w-full object-cover opacity-40"
            />
            <div className="absolute inset-0" style={{ background: 'radial-gradient(circle at 50% 50%, rgba(7,7,19,0.2), rgba(7,7,19,0.85))' }} />
            <LivingAtlas artifacts={world.artifacts} className="relative h-[420px] w-full sm:h-[520px]" />

            {/* clickable node overlay positioned on the same normalized coords */}
            <div className="pointer-events-none absolute inset-0">
              {world.artifacts.map((a) => (
                <button
                  key={a.artifactId}
                  type="button"
                  onClick={() => setSelected(a)}
                  className="pointer-events-auto absolute -translate-x-1/2 -translate-y-1/2 rounded-full p-1 transition-transform hover:scale-125 focus-visible:scale-125"
                  style={{ left: `${a.x * 100}%`, top: `${a.y * 100}%` }}
                  aria-label={`Open ${a.title}`}
                >
                  <span
                    className="block h-3 w-3 rounded-full"
                    style={{ background: TYPE_COLOR[a.type] || '#F5EBDD', boxShadow: `0 0 14px ${TYPE_COLOR[a.type] || '#F5EBDD'}` }}
                  />
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* canon rules legend */}
      <section className="grid gap-5 lg:grid-cols-3">
        <div className="bezel lg:col-span-1">
          <div className="bezel-core p-6">
            <h2 className="myth-title text-xl text-bone">World rules</h2>
            <p className="mt-1 text-[12px] text-bone/50">The laws every proposal is measured against.</p>
            <ol className="mt-4 space-y-2.5">
              {world.rules.map((r, i) => (
                <li key={r.id} className="flex gap-3 text-sm text-bone/75">
                  <span className="font-mono text-rune">{String(i + 1).padStart(2, '0')}</span>
                  <span>{r.text}</span>
                </li>
              ))}
            </ol>
          </div>
        </div>

        <div className="bezel lg:col-span-2">
          <div className="bezel-core p-6">
            <div className="flex items-center justify-between">
              <h2 className="myth-title text-xl text-bone">Canon pieces</h2>
              <Link to="/hall" className="ink-link inline-flex items-center gap-1 text-sm">
                Open the hall <ArrowUpRight size={14} />
              </Link>
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {world.artifacts.map((a) => (
                <button
                  key={a.artifactId}
                  type="button"
                  onClick={() => setSelected(a)}
                  className="glass-panel flex items-center gap-3 p-3 text-left transition-colors hover:border-rune"
                >
                  <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: TYPE_COLOR[a.type] }} />
                  <span className="min-w-0">
                    <span className="block truncate text-sm text-bone">{a.title}</span>
                    <span className="block text-[11px] text-bone/45">{a.type} {'\u00b7'} Canon Fit {a.canonFitScore}</span>
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* detail drawer */}
      {selected ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-md"
          style={{ background: 'rgba(7,7,19,0.7)' }}
          onClick={() => setSelected(null)}
        >
          <motion.div
            initial={{ scale: 0.94, opacity: 0, y: 16 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 200, damping: 22 }}
            className="bezel w-full max-w-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bezel-core overflow-hidden">
              <div className="relative aspect-video">
                <AssetImage src={selected.image || ''} alt={selected.title} className="h-full w-full object-cover" />
                <button
                  type="button"
                  onClick={() => setSelected(null)}
                  className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-black/50 text-bone"
                  aria-label="Close"
                >
                  <X size={16} />
                </button>
              </div>
              <div className="space-y-3 p-6">
                <span className="rune-chip">{selected.type}</span>
                <h3 className="myth-title text-2xl text-bone">{selected.title}</h3>
                <p className="text-sm text-bone/70">{selected.summary}</p>
                <div className="grid grid-cols-2 gap-3 pt-2 text-sm">
                  <Info label="Canon Fit" value={String(selected.canonFitScore)} />
                  <Info label="Accepted" value={formatDate(selected.acceptedDate)} />
                  <Info label="Source" value={selected.sourceProposal} />
                  <Info label="Connections" value={String(selected.connections.length)} icon />
                </div>
                <div className="pt-2">
                  <ProofHashBadge hash={selected.proofHash} label="Decision proof" />
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </div>
  )
}

function Info({ label, value, icon }: { label: string; value: string; icon?: boolean }) {
  return (
    <div className="glass-panel p-3">
      <p className="text-[10px] uppercase tracking-[0.16em] text-bone/45">{label}</p>
      <p className="mt-0.5 inline-flex items-center gap-1 text-bone/85">
        {icon ? <Link2 size={12} color="var(--rune-cyan)" /> : null}
        {value}
      </p>
    </div>
  )
}
