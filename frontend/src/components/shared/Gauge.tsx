import { motion } from 'framer-motion'
import { useReducedMotion } from '../../state/store'

// A named world-quantity gauge. Never a bare "score" headline; always a named
// metric (Canon Fit, Continuity Risk, Originality, Tone Match).

interface Props {
  label: string
  value: number
  color: string
  invert?: boolean // for risk: high value is bad
  hint?: string
}

export function Gauge({ label, value, color, invert = false, hint }: Props) {
  const reduced = useReducedMotion()
  const pct = Math.max(0, Math.min(100, value))
  return (
    <div className="space-y-1.5">
      <div className="flex items-baseline justify-between">
        <span className="text-[11px] uppercase tracking-[0.18em] text-silver">{label}</span>
        <span className="font-mono text-sm" style={{ color }}>
          {pct}
          <span className="text-bone/40 text-[10px]"> / 100</span>
        </span>
      </div>
      <div className="gauge-track h-2 w-full" role="meter" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label={label}>
        <motion.div
          className="h-full rounded-full"
          style={{ background: `linear-gradient(90deg, ${color}, ${color}cc)`, boxShadow: `0 0 14px -2px ${color}` }}
          initial={reduced ? false : { width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.9, ease: [0.32, 0.72, 0, 1] }}
        />
      </div>
      {hint ? <p className="text-[11px] text-bone/45">{invert ? 'Lower is safer. ' : ''}{hint}</p> : null}
    </div>
  )
}
