import { motion } from 'framer-motion'
import { useReducedMotion } from '../../state/store'

// A small drifting rune mote used as ambient decoration. Pure transform/opacity.

interface Props {
  size?: number
  color?: string
  delay?: number
  x?: string
  y?: string
}

export function FloatingRune({ size = 6, color = 'var(--rune-cyan)', delay = 0, x = '50%', y = '50%' }: Props) {
  const reduced = useReducedMotion()
  const style = { left: x, top: y, width: size, height: size, background: color, boxShadow: `0 0 12px ${color}` }
  if (reduced) {
    return <span className="pointer-events-none absolute rounded-full opacity-40" style={style} />
  }
  return (
    <motion.span
      className="pointer-events-none absolute rounded-full"
      style={style}
      initial={{ opacity: 0.2, y: 0 }}
      animate={{ opacity: [0.2, 0.8, 0.2], y: [0, -14, 0] }}
      transition={{ duration: 6 + delay, repeat: Infinity, ease: 'easeInOut', delay }}
    />
  )
}
