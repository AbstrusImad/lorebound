import { motion } from 'framer-motion'
import { Link2, FileJson } from 'lucide-react'
import type { CanonArtifact } from '../../types'
import { AssetImage } from '../shared/AssetImage'
import { ProofHashBadge } from '../shared/ProofHashBadge'
import { formatDate } from '../../utils/formatters'

const TYPE_GRADIENT: Record<string, string> = {
  Character: 'radial-gradient(120% 120% at 30% 20%, rgba(255,107,154,0.3), transparent 55%), linear-gradient(140deg, var(--royal-indigo), var(--void-ink))',
  Location: 'radial-gradient(120% 120% at 30% 20%, rgba(116,235,213,0.3), transparent 55%), linear-gradient(140deg, var(--royal-indigo), var(--void-ink))',
  Relic: 'radial-gradient(120% 120% at 30% 20%, rgba(244,201,93,0.32), transparent 55%), linear-gradient(140deg, var(--royal-indigo), var(--void-ink))',
  Faction: 'radial-gradient(120% 120% at 30% 20%, rgba(92,141,255,0.3), transparent 55%), linear-gradient(140deg, var(--royal-indigo), var(--void-ink))',
  Event: 'radial-gradient(120% 120% at 30% 20%, rgba(244,201,93,0.26), transparent 55%), linear-gradient(140deg, var(--royal-indigo), var(--void-ink))',
  Creature: 'radial-gradient(120% 120% at 30% 20%, rgba(102,230,163,0.3), transparent 55%), linear-gradient(140deg, var(--royal-indigo), var(--void-ink))'
}

interface Props {
  artifact: CanonArtifact
  index: number
  onOpen: (a: CanonArtifact) => void
  onExport: (a: CanonArtifact) => void
}

export function ArtifactHallRelic({ artifact, index, onOpen, onExport }: Props) {
  const gradient = TYPE_GRADIENT[artifact.type] || TYPE_GRADIENT.Relic
  return (
    <motion.article
      initial={{ opacity: 0, y: 30, filter: 'blur(8px)' }}
      whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{ delay: (index % 3) * 0.08, duration: 0.6, ease: [0.32, 0.72, 0, 1] }}
      className="bezel group cursor-pointer"
      onClick={() => onOpen(artifact)}
    >
      <div className="bezel-core overflow-hidden">
        <div className="relative aspect-[4/3] overflow-hidden">
          <motion.div className="h-full w-full" whileHover={{ scale: 1.06 }} transition={{ duration: 0.7, ease: [0.32, 0.72, 0, 1] }}>
            <AssetImage
              src={artifact.image || ''}
              alt={artifact.title}
              gradient={gradient}
              className="h-full w-full object-cover"
            />
          </motion.div>
          <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, transparent 40%, rgba(7,7,19,0.85))' }} />
          <span className="rune-chip absolute left-3 top-3 !bg-black/40">{artifact.type}</span>
        </div>
        <div className="space-y-3 p-5">
          <div>
            <h3 className="myth-title text-lg text-bone">{artifact.title}</h3>
            <p className="mt-1 line-clamp-2 text-[13px] text-bone/55">{artifact.summary}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-[11px] text-bone/45">
            <span className="font-mono">Canon Fit {artifact.canonFitScore}</span>
            <span>{'\u00b7'}</span>
            <span>{formatDate(artifact.acceptedDate)}</span>
            <span>{'\u00b7'}</span>
            <span className="inline-flex items-center gap-1">
              <Link2 size={11} /> {artifact.connections.length}
            </span>
          </div>
          <div className="flex items-center justify-between gap-2 pt-1">
            <ProofHashBadge hash={artifact.proofHash} />
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                onExport(artifact)
              }}
              className="rune-chip inline-flex items-center gap-1.5 hover:border-rune"
              aria-label={`Export ${artifact.title} as JSON`}
            >
              <FileJson size={12} /> JSON
            </button>
          </div>
        </div>
      </div>
    </motion.article>
  )
}
