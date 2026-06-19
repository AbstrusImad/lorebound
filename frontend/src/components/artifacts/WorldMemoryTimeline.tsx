import { motion } from 'framer-motion'
import { CheckCircle2, XCircle, RefreshCcw, Scale, Sparkles } from 'lucide-react'
import type { Verdict } from '../../types'
import { verdictColor, verdictLabel, formatDate } from '../../utils/formatters'

export interface TimelineEntry {
  id: string
  title: string
  verdict: Verdict | 'SEED'
  date: string
  detail: string
  type: string
}

const ICON: Record<string, typeof CheckCircle2> = {
  ACCEPTED: CheckCircle2,
  REJECTED: XCircle,
  NEEDS_REVISION: RefreshCcw,
  NEEDS_HUMAN_VOTE: Scale,
  SEED: Sparkles,
  '': Scale
}

function isRealDate(d: string): boolean {
  if (!d) return false
  const t = new Date(d).getTime()
  return !Number.isNaN(t) && /\d{4}/.test(d)
}

export function WorldMemoryTimeline({ entries }: { entries: TimelineEntry[] }) {
  return (
    <div className="relative">
      {/* the living temporal ribbon */}
      <div
        className="absolute bottom-0 left-[18px] top-0 w-[2px] md:left-1/2 md:-translate-x-1/2"
        style={{ background: 'linear-gradient(180deg, transparent, var(--rune-cyan), var(--myth-gold), transparent)' }}
      />
      <ul className="space-y-8">
        {entries.map((e, i) => {
          const color = e.verdict === 'SEED' ? 'var(--myth-gold)' : verdictColor(e.verdict as Verdict)
          const Icon = ICON[e.verdict] || Sparkles
          const left = i % 2 === 0
          return (
            <li key={e.id} className="relative md:grid md:grid-cols-2 md:gap-8">
              <div className={`md:contents`}>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-40px' }}
                  transition={{ duration: 0.5, ease: [0.32, 0.72, 0, 1] }}
                  className={`ml-12 md:ml-0 ${left ? 'md:col-start-1 md:text-right' : 'md:col-start-2'}`}
                >
                  <div className="glass-panel inline-block p-4 text-left">
                    <div className="flex items-center gap-2">
                      <span className="myth-title text-bone">{e.title}</span>
                    </div>
                    <p className="mt-1 text-[12px] text-bone/55">{e.detail}</p>
                    <div className="mt-2 flex items-center gap-2 text-[11px]">
                      <span className="rune-chip">{e.type}</span>
                      <span style={{ color }}>{e.verdict === 'SEED' ? 'Founding canon' : verdictLabel(e.verdict as Verdict)}</span>
                      {isRealDate(e.date) ? <span className="text-bone/40">{formatDate(e.date)}</span> : null}
                    </div>
                  </div>
                </motion.div>
              </div>
              {/* node marker */}
              <span
                className="absolute left-[18px] top-2 flex h-9 w-9 -translate-x-1/2 items-center justify-center rounded-full md:left-1/2"
                style={{ background: 'var(--void-ink)', border: `1px solid ${color}`, boxShadow: `0 0 20px -6px ${color}` }}
              >
                <Icon size={15} color={color} />
              </span>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
