import { useState } from 'react'

// Graceful image with a CSS-gradient fallback. If an asset is missing the page
// never breaks; it shows a mythic gradient placeholder instead.

interface Props {
  src: string
  alt: string
  className?: string
  gradient?: string
  rounded?: string
}

const DEFAULT_GRADIENT =
  'radial-gradient(120% 120% at 30% 20%, rgba(116,235,213,0.28), transparent 55%), radial-gradient(120% 120% at 80% 90%, rgba(92,141,255,0.26), transparent 55%), linear-gradient(140deg, var(--royal-indigo), var(--void-ink))'

export function AssetImage({ src, alt, className = '', gradient, rounded = '' }: Props) {
  const [failed, setFailed] = useState(false)
  if (failed) {
    return (
      <div
        className={`${className} ${rounded}`}
        role="img"
        aria-label={alt}
        style={{ background: gradient || DEFAULT_GRADIENT }}
      />
    )
  }
  return (
    <img
      src={src}
      alt={alt}
      loading="lazy"
      decoding="async"
      className={`${className} ${rounded}`}
      onError={() => setFailed(true)}
    />
  )
}
