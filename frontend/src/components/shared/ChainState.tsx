import type { ReactNode } from 'react'
import { Loader2, AlertTriangle, RotateCcw, ExternalLink } from 'lucide-react'
import { CONTRACT_ADDRESS, EXPLORER } from '../../genlayer/genlayerClient'

// Shared loading and error surfaces for on-chain reads. A failed read NEVER
// falls back to fabricated content: it shows this error card with a retry and
// an explorer link instead.

export function LoadingCard({ label = 'Reading the canon from Bradbury' }: { label?: string }) {
  return (
    <div className="bezel">
      <div className="bezel-core flex flex-col items-center justify-center gap-4 p-16 text-center">
        <Loader2 size={36} color="var(--rune-cyan)" className="animate-spin" />
        <p className="myth-title text-lg text-bone">{label}</p>
        <p className="text-[12px] text-bone/50">If Bradbury is busy, the read retries automatically.</p>
      </div>
    </div>
  )
}

export function SkeletonGrid({ count = 6 }: { count?: number }) {
  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="bezel">
          <div className="bezel-core animate-pulse space-y-3 p-5">
            <div className="aspect-[4/3] w-full rounded-xl" style={{ background: 'rgba(245,235,221,0.06)' }} />
            <div className="h-4 w-2/3 rounded" style={{ background: 'rgba(245,235,221,0.08)' }} />
            <div className="h-3 w-full rounded" style={{ background: 'rgba(245,235,221,0.05)' }} />
          </div>
        </div>
      ))}
    </div>
  )
}

export function ErrorCard({
  message,
  onRetry,
  children
}: {
  message: string
  onRetry?: () => void
  children?: ReactNode
}) {
  const busy = /busy|retry/i.test(message)
  return (
    <div className="bezel">
      <div className="bezel-core flex flex-col items-center justify-center gap-4 p-12 text-center">
        <div
          className="flex h-14 w-14 items-center justify-center rounded-full"
          style={{ border: '1px solid var(--line-2)', color: 'var(--danger-ruby)' }}
        >
          <AlertTriangle size={24} />
        </div>
        <h3 className="myth-title text-xl text-bone">{busy ? 'Bradbury is busy' : 'Could not read the canon'}</h3>
        <p className="max-w-md text-sm text-bone/60">
          {busy ? 'Bradbury is busy, retrying the on-chain read.' : message}
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3 pt-1">
          {onRetry ? (
            <button type="button" onClick={onRetry} className="cta cta-ghost">
              Retry
              <span className="cta-icon">
                <RotateCcw size={15} />
              </span>
            </button>
          ) : null}
          <a
            href={`${EXPLORER}/address/${CONTRACT_ADDRESS}`}
            target="_blank"
            rel="noreferrer"
            className="cta cta-ghost"
          >
            View contract
            <span className="cta-icon">
              <ExternalLink size={14} />
            </span>
          </a>
        </div>
        {children}
      </div>
    </div>
  )
}
