import { motion } from 'framer-motion'
import type { CanonRule } from '../../types'
import { useReducedMotion } from '../../state/store'

// Canon rules orbit the proposal at the center. Contradicted rules flare red.

interface Props {
  rules: CanonRule[]
  contradicted: string[]
  centerLabel: string
}

export function CanonRuleRing({ rules, contradicted, centerLabel }: Props) {
  const reduced = useReducedMotion()
  const radius = 42 // percent
  return (
    <div className="relative mx-auto aspect-square w-full max-w-[440px]">
      {/* orbit guide */}
      <div className="absolute inset-[8%] rounded-full border border-line1" />
      <div className="absolute inset-[20%] rounded-full border border-line1" />

      <motion.div
        className="absolute inset-0"
        animate={reduced ? {} : { rotate: 360 }}
        transition={{ duration: 60, repeat: Infinity, ease: 'linear' }}
      >
        {rules.map((rule, i) => {
          const angle = (i / rules.length) * Math.PI * 2 - Math.PI / 2
          const cx = 50 + Math.cos(angle) * radius
          const cy = 50 + Math.sin(angle) * radius
          const broken = contradicted.includes(rule.text)
          return (
            <motion.div
              key={rule.id}
              className="absolute -translate-x-1/2 -translate-y-1/2"
              style={{ left: `${cx}%`, top: `${cy}%` }}
              animate={reduced ? {} : { rotate: -360 }}
              transition={{ duration: 60, repeat: Infinity, ease: 'linear' }}
            >
              <div
                className="w-36 rounded-xl border px-3 py-2 text-[11px] leading-snug backdrop-blur-sm"
                style={{
                  borderColor: broken ? 'var(--danger-ruby)' : 'var(--line-2)',
                  background: broken ? 'rgba(232,93,117,0.12)' : 'rgba(16,16,36,0.6)',
                  color: broken ? 'var(--danger-ruby)' : 'var(--muted-silver)',
                  boxShadow: broken ? '0 0 24px -8px var(--danger-ruby)' : 'none'
                }}
              >
                {rule.text}
              </div>
            </motion.div>
          )
        })}
      </motion.div>

      {/* center proposal core */}
      <div className="absolute left-1/2 top-1/2 flex h-28 w-28 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full p-3 text-center"
        style={{ background: 'radial-gradient(circle, rgba(116,235,213,0.18), rgba(7,7,19,0.9))', border: '1px solid var(--line-3)' }}>
        <span className="myth-title text-sm text-bone">{centerLabel}</span>
      </div>
    </div>
  )
}
