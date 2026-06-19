import { motion } from 'framer-motion'
import type { ReactNode } from 'react'
import { useReducedMotion } from '../../state/store'

// Page transitions feel like traveling between chambers: a soft depth-shift and
// blur resolve. Reduced motion collapses to an instant render.

export function PageTransition({ children }: { children: ReactNode }) {
  const reduced = useReducedMotion()
  if (reduced) return <div>{children}</div>
  return (
    <motion.div
      initial={{ opacity: 0, y: 24, filter: 'blur(8px)' }}
      animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
      exit={{ opacity: 0, y: -16, filter: 'blur(6px)' }}
      transition={{ duration: 0.6, ease: [0.32, 0.72, 0, 1] }}
    >
      {children}
    </motion.div>
  )
}
