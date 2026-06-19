import { useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Link2 } from 'lucide-react'
import { ArtifactHallRelic } from '../components/artifacts/ArtifactHallRelic'
import { AssetImage } from '../components/shared/AssetImage'
import { ProofHashBadge } from '../components/shared/ProofHashBadge'
import { EmptyState } from '../components/shared/EmptyState'
import { useStore } from '../state/store'
import { useToast } from '../components/shared/Toast'
import type { CanonArtifact, LoreType } from '../types'
import { formatDate } from '../utils/formatters'

const FILTERS: (LoreType | 'All')[] = ['All', 'Faction', 'Location', 'Relic', 'Event', 'Character', 'Creature']

export function ArtifactHall() {
  const { world } = useStore()
  const toast = useToast()
  const [filter, setFilter] = useState<LoreType | 'All'>('All')
  const [open, setOpen] = useState<CanonArtifact | null>(null)

  const shown = useMemo(
    () => (filter === 'All' ? world.artifacts : world.artifacts.filter((a) => a.type === filter)),
    [filter, world.artifacts]
  )

  const exportArtifact = (a: CanonArtifact) => {
    const blob = new Blob([JSON.stringify(a, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${a.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.json`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
    toast.push('success', `Exported ${a.title}.`)
  }

  return (
    <div className="space-y-8">
      <header className="relative">
        <div className="bezel overflow-hidden">
          <div className="bezel-core relative overflow-hidden p-8 sm:p-12">
            <AssetImage src="/assets/hall-bg.webp" alt="" className="absolute inset-0 h-full w-full object-cover opacity-45" />
            <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, rgba(7,7,19,0.45), rgba(7,7,19,0.85))' }} />
            <div className="relative">
              <span className="eyebrow">The reliquary</span>
              <h1 className="myth-title mt-3 text-4xl text-bone sm:text-5xl">Artifact Hall</h1>
              <p className="mt-3 max-w-2xl text-[15px] text-bone/65">
                Every accepted canon piece, sealed and floating. Each relic carries its proof, its
                connections and the decision that admitted it.
              </p>
            </div>
          </div>
        </div>
      </header>

      <div className="flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFilter(f)}
            className={`rune-chip ${filter === f ? 'border-rune text-bone' : 'hover:border-rune'}`}
          >
            {f}
          </button>
        ))}
      </div>

      {shown.length === 0 ? (
        <EmptyState title="No relics here yet" body="Accept a proposal in the Continuity Trial and it will appear in the hall." />
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {shown.map((a, i) => (
            <ArtifactHallRelic key={a.artifactId} artifact={a} index={i} onOpen={setOpen} onExport={exportArtifact} />
          ))}
        </div>
      )}

      <AnimatePresence>
        {open ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-md"
            style={{ background: 'rgba(7,7,19,0.7)' }}
            onClick={() => setOpen(null)}
          >
            <motion.div
              initial={{ scale: 0.94, opacity: 0, y: 16 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.96, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 200, damping: 22 }}
              className="bezel w-full max-w-lg"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="bezel-core overflow-hidden">
                <div className="relative aspect-video">
                  <AssetImage src={open.image || ''} alt={open.title} className="h-full w-full object-cover" />
                  <button
                    type="button"
                    onClick={() => setOpen(null)}
                    className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-black/50 text-bone"
                    aria-label="Close"
                  >
                    <X size={16} />
                  </button>
                </div>
                <div className="space-y-3 p-6">
                  <span className="rune-chip">{open.type}</span>
                  <h3 className="myth-title text-2xl text-bone">{open.title}</h3>
                  <p className="text-sm text-bone/70">{open.summary}</p>
                  <div className="grid grid-cols-2 gap-3 pt-1 text-sm">
                    <Cell label="Canon Fit" value={String(open.canonFitScore)} />
                    <Cell label="Accepted" value={formatDate(open.acceptedDate)} />
                    <Cell label="Connections" value={String(open.connections.length)} icon />
                    <Cell label="Sealed by" value={open.accepted} />
                  </div>
                  <div className="pt-1">
                    <ProofHashBadge hash={open.proofHash} label="Decision proof" />
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  )
}

function Cell({ label, value, icon }: { label: string; value: string; icon?: boolean }) {
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
