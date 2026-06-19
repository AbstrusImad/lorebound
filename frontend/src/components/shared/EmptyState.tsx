import type { ReactNode } from 'react'
import { Compass } from 'lucide-react'

interface Props {
  title: string
  body: string
  icon?: ReactNode
  action?: ReactNode
}

export function EmptyState({ title, body, icon, action }: Props) {
  return (
    <div className="glass-panel flex flex-col items-center justify-center gap-3 p-12 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full border border-line2 text-rune">
        {icon || <Compass size={24} />}
      </div>
      <h3 className="myth-title text-xl text-bone">{title}</h3>
      <p className="max-w-md text-sm text-bone/55">{body}</p>
      {action}
    </div>
  )
}
