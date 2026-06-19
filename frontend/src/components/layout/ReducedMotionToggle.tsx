import { Pause, Play } from 'lucide-react'
import { useStore } from '../../state/store'

export function ReducedMotionToggle() {
  const { settings, setReducedMotion } = useStore()
  const on = settings.reducedMotion
  return (
    <button
      type="button"
      onClick={() => setReducedMotion(!on)}
      className="rune-chip inline-flex items-center gap-2 hover:border-rune transition-colors"
      aria-pressed={on}
      title={on ? 'Motion paused. Tap to resume.' : 'Pause heavy motion'}
    >
      {on ? <Play size={12} /> : <Pause size={12} />}
      <span className="text-bone/70">{on ? 'Motion off' : 'Motion on'}</span>
    </button>
  )
}
