import { motion } from 'framer-motion'
import * as Icons from 'lucide-react'
import type { ValidatorCase } from '../../data/validatorCases'

// A full-depth layer card for the Validator Chamber. Shows what the layer
// checked, the evidence it used, its ruling, why, and any fault detected.

export function ValidatorLayer({ data, index }: { data: ValidatorCase; index: number }) {
  const ok = data.status === 'accepted'
  const color = ok ? 'var(--success-mint)' : 'var(--danger-ruby)'
  const Icon = (Icons as unknown as Record<string, Icons.LucideIcon>)[data.icon] || Icons.Shield

  return (
    <motion.article
      initial={{ opacity: 0, y: 24, filter: 'blur(6px)' }}
      whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ delay: (index % 2) * 0.08, duration: 0.6, ease: [0.32, 0.72, 0, 1] }}
      className="bezel group"
    >
      <div className="bezel-core p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <span
              className="flex h-11 w-11 items-center justify-center rounded-xl"
              style={{ background: 'rgba(116,235,213,0.1)', border: '1px solid var(--line-2)' }}
            >
              <Icon size={20} color="var(--rune-cyan)" />
            </span>
            <div>
              <h3 className="myth-title text-lg text-bone">{data.name}</h3>
              <p className="text-[12px] text-bone/55">{data.role}</p>
            </div>
          </div>
          <span
            className="rune-chip shrink-0"
            style={{ color, borderColor: color }}
          >
            {ok ? 'sealed' : 'flagged'}
          </span>
        </div>

        <dl className="mt-5 space-y-3 text-sm">
          <div>
            <dt className="text-[11px] uppercase tracking-[0.18em] text-spirit">Checked</dt>
            <dd className="mt-1 text-bone/80">{data.checked}</dd>
          </div>
          <div>
            <dt className="text-[11px] uppercase tracking-[0.18em] text-rune">Evidence used</dt>
            <dd className="mt-1 text-bone/80">{data.evidence}</dd>
          </div>
          <div>
            <dt className="text-[11px] uppercase tracking-[0.18em] text-gold">Why</dt>
            <dd className="mt-1 text-bone/80">{data.why}</dd>
          </div>
          {data.fault ? (
            <div>
              <dt className="text-[11px] uppercase tracking-[0.18em] text-ruby">Fault detected</dt>
              <dd className="mt-1 text-ruby/90">{data.fault}</dd>
            </div>
          ) : null}
        </dl>
      </div>
    </motion.article>
  )
}
