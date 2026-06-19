import { motion } from 'framer-motion'
import { CheckCircle2, XCircle } from 'lucide-react'
import type { ValidatorResult } from '../../types'

// A compact pass card used in the Continuity Trial result to show each layer's
// independent ruling.

export function ValidatorPassCard({ result, index }: { result: ValidatorResult; index: number }) {
  const ok = result.status === 'accepted'
  const color = ok ? 'var(--success-mint)' : 'var(--danger-ruby)'
  return (
    <motion.div
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.06, duration: 0.4, ease: [0.32, 0.72, 0, 1] }}
      className="glass-panel flex items-start gap-3 p-3.5"
    >
      {ok ? <CheckCircle2 size={16} color={color} className="mt-0.5 shrink-0" /> : <XCircle size={16} color={color} className="mt-0.5 shrink-0" />}
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-sm font-semibold text-bone">{result.validator}</p>
          <span className="font-mono text-[10px] uppercase tracking-wider" style={{ color }}>
            {ok ? 'pass' : 'flag'}
          </span>
        </div>
        <p className="mt-0.5 text-[12px] text-bone/55">{result.reason}</p>
        {result.fault ? <p className="mt-1 text-[11px] text-ruby/90">{result.fault}</p> : null}
      </div>
    </motion.div>
  )
}
