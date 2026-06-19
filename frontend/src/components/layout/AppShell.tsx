import { useState, type ReactNode } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { Menu, X, Sparkles } from 'lucide-react'
import { WalletButton } from './WalletButton'

const NAV = [
  { to: '/', label: 'World Gate', end: true },
  { to: '/atlas', label: 'Canon Atlas' },
  { to: '/forge', label: 'Lore Forge' },
  { to: '/trial', label: 'Continuity Trial' },
  { to: '/constellation', label: 'Constellation' },
  { to: '/hall', label: 'Artifact Hall' },
  { to: '/memory', label: 'World Memory' },
  { to: '/validators', label: 'Validators' }
]

export function AppShell({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false)
  const location = useLocation()

  return (
    <div className="relative min-h-[100dvh]">
      <div className="world-field" />
      <div className="world-grain" />

      {/* Floating glass nav island */}
      <header className="sticky top-0 z-40 px-4 pt-4">
        <nav className="bezel mx-auto flex max-w-7xl items-center justify-between gap-4 !rounded-full !p-2 pl-5 backdrop-blur-xl">
          <Link to="/" className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-full" style={{ background: 'linear-gradient(120deg, var(--myth-gold), var(--rune-cyan))' }}>
              <Sparkles size={16} color="#0a0a18" />
            </span>
            <span className="myth-title text-lg tracking-wide text-bone">Lorebound</span>
          </Link>

          <div className="hidden items-center gap-1 xl:flex">
            {NAV.map((n) => (
              <NavLink
                key={n.to}
                to={n.to}
                end={n.end}
                className={({ isActive }) =>
                  `rounded-full px-3 py-2 text-sm transition-colors duration-300 ${
                    isActive ? 'text-bone' : 'text-silver hover:text-bone'
                  }`
                }
              >
                {({ isActive }) => (
                  <span className="relative">
                    {n.label}
                    {isActive ? (
                      <motion.span
                        layoutId="nav-underline"
                        className="absolute -bottom-1 left-0 right-0 mx-auto h-[2px] w-5 rounded-full"
                        style={{ background: 'var(--rune-cyan)' }}
                      />
                    ) : null}
                  </span>
                )}
              </NavLink>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <WalletButton />
            <button
              type="button"
              onClick={() => setOpen((o) => !o)}
              className="flex h-9 w-9 items-center justify-center rounded-full border border-line2 text-bone xl:hidden"
              aria-label={open ? 'Close menu' : 'Open menu'}
              aria-expanded={open}
            >
              {open ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>
        </nav>
      </header>

      {/* Mobile / tablet menu overlay */}
      <AnimatePresence>
        {open ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-30 flex flex-col items-center justify-center gap-1 px-6 backdrop-blur-2xl xl:hidden"
            style={{ background: 'rgba(7,7,19,0.86)' }}
          >
            {NAV.map((n, i) => (
              <motion.div
                key={n.to}
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.04 * i, duration: 0.4, ease: [0.32, 0.72, 0, 1] }}
              >
                <NavLink
                  to={n.to}
                  end={n.end}
                  onClick={() => setOpen(false)}
                  className={({ isActive }) =>
                    `myth-title block px-4 py-3 text-2xl ${isActive ? 'gold-text' : 'text-bone/80'}`
                  }
                >
                  {n.label}
                </NavLink>
              </motion.div>
            ))}
          </motion.div>
        ) : null}
      </AnimatePresence>

      <main className="relative z-10 mx-auto max-w-7xl px-4 pb-24 pt-10" key={location.pathname}>
        {children}
      </main>

      <footer className="relative z-10 border-t border-line1 px-4 py-10">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 text-center sm:flex-row sm:text-left">
          <div>
            <p className="myth-title text-bone">Lorebound</p>
            <p className="text-xs text-bone/45">Build worlds the canon can remember.</p>
          </div>
          <p className="font-mono text-[11px] text-bone/40">
            Canon verified by GenLayer consensus. Live on Bradbury testnet.
          </p>
        </div>
      </footer>
    </div>
  )
}
