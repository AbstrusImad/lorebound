import { motion } from 'framer-motion'
import { CheckCircle2, XCircle, RefreshCcw, Scale } from 'lucide-react'
import type { Verdict } from '../../types'
import { verdictLabel, verdictColor } from '../../utils/formatters'
import { useReducedMotion } from '../../state/store'

// The verdict manifests as a living seal: a rotating sigil ring around an icon.

const ICON: Record<Verdict, typeof CheckCircle2> = {
  ACCEPTED: CheckCircle2,
  REJECTED: XCircle,
  NEEDS_REVISION: RefreshCcw,
  NEEDS_HUMAN_VOTE: Scale,
  '': Scale
}

export function VerdictSeal({ verdict, size = 132 }: { verdict: Verdict; size?: number }) {
  const reduced = useReducedMotion()
  const color = verdictColor(verdict)
  const Icon = ICON[verdict] || Scale
  return (
    <div className="relative flex flex-col items-center gap-3">
      <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
        <motion.div
          className="absolute inset-0 rounded-full"
          style={{ border: `1px solid ${color}`, boxShadow: `0 0 50px -12px ${color}` }}
          animate={reduced ? {} : { rotate: 360 }}
          transition={{ duration: 22, repeat: Infinity, ease: 'linear' }}
        />
        <motion.div
          className="absolute rounded-full"
          style={{ inset: 14, border: `1px dashed ${color}88` }}
          animate={reduced ? {} : { rotate: -360 }}
          transition={{ duration: 30, repeat: Infinity, ease: 'linear' }}
        />
        <motion.div
          initial={reduced ? false : { scale: 0.6, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 160, damping: 14 }}
          className="flex items-center justify-center rounded-full"
          style={{ width: size * 0.52, height: size * 0.52, background: `${color}1a` }}
        >
          <Icon size={size * 0.28} color={color} />
        </motion.div>
      </div>
      <span className="myth-title text-lg" style={{ color }}>
        {verdictLabel(verdict)}
      </span>
    </div>
  )
}
