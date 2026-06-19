import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  ArrowUpRight,
  ScrollText,
  Layers,
  ShieldCheck,
  Sparkles,
  GitBranch,
  Network,
  Eye
} from 'lucide-react'
import { MotionPortal } from '../components/animation/MotionPortal'
import { AssetImage } from '../components/shared/AssetImage'
import { VerdictSeal } from '../components/trial/VerdictSeal'
import { FloatingRune } from '../components/animation/FloatingRune'
import { LoadingCard, ErrorCard } from '../components/shared/ChainState'
import { useStore } from '../state/store'

const fadeUp = {
  initial: { opacity: 0, y: 28, filter: 'blur(8px)' },
  whileInView: { opacity: 1, y: 0, filter: 'blur(0px)' },
  viewport: { once: true, margin: '-60px' },
  transition: { duration: 0.7, ease: [0.32, 0.72, 0, 1] as [number, number, number, number] }
}

const WHY = [
  {
    icon: ShieldCheck,
    title: 'Why GenLayer matters',
    body: 'Canon is a shared truth. No single author should rule whether a piece belongs. GenLayer validators each judge a proposal independently and reach consensus, then settle the canon on chain.'
  },
  {
    icon: Layers,
    title: 'Canon is more than storage',
    body: 'A world is not a database of entries. It is a web of rules, tone and continuity. Lorebound treats every proposal as a question against that living web, not a row to insert.'
  },
  {
    icon: GitBranch,
    title: 'How the world evolves',
    body: 'Accepted lore becomes a new star in the constellation, wired to the canon it touches. Rejected pieces break apart. Revisions hover until they are reconciled.'
  },
  {
    icon: Eye,
    title: 'Validator depth, not field checks',
    body: 'The validators do not check that JSON is well formed. They confirm cited evidence is real, re-derive contradictions, weigh tone, detect duplication and catch canon-override attempts.'
  }
]

export function WorldGate() {
  const { world, proposals, loading, error, refresh } = useStore()

  if (loading && !world) {
    return (
      <div className="space-y-8">
        <LoadingCard label="Opening the World Gate" />
      </div>
    )
  }
  if (error && !world) {
    return (
      <div className="space-y-8">
        <ErrorCard message={error} onRetry={refresh} />
      </div>
    )
  }
  if (!world) {
    return (
      <div className="space-y-8">
        <ErrorCard message="No world is published on chain yet." onRetry={refresh} />
      </div>
    )
  }

  // The real accepted proposal from chain drives the worked preview seal.
  const accepted = proposals.find((p) => p.verdict === 'ACCEPTED') || null

  return (
    <div className="space-y-28">
      {/* HERO */}
      <section className="relative">
        <div className="bezel overflow-hidden">
          <div className="bezel-core relative overflow-hidden">
            {/* painted backdrop */}
            <AssetImage
              src="/assets/world-gate-hero.webp"
              alt="A floating city of silent-glass spires above an endless storm of clouds"
              className="absolute inset-0 h-full w-full object-cover opacity-70"
            />
            <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, rgba(7,7,19,0.4), rgba(7,7,19,0.82))' }} />
            {/* live R3F portal layer */}
            <MotionPortal className="pointer-events-none absolute -right-10 top-1/2 hidden h-[520px] w-[520px] -translate-y-1/2 opacity-90 lg:block" />

            <FloatingRune x="14%" y="30%" delay={0.5} />
            <FloatingRune x="22%" y="68%" color="var(--myth-gold)" delay={1.4} />
            <FloatingRune x="40%" y="22%" color="var(--spirit-blue)" delay={2.1} />

            <div className="relative z-10 px-6 py-24 sm:px-12 lg:max-w-2xl lg:py-32">
              <motion.span
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="eyebrow"
              >
                Collective worldbuilding, canon by consensus
              </motion.span>
              <motion.h1
                initial={{ opacity: 0, y: 18, filter: 'blur(10px)' }}
                animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                transition={{ duration: 0.9, ease: [0.32, 0.72, 0, 1] }}
                className="myth-title mt-4 text-6xl leading-none text-bone sm:text-7xl"
              >
                Lorebound
              </motion.h1>
              <motion.p
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.7 }}
                className="mt-5 max-w-xl font-sub text-2xl text-bone/80"
              >
                Build worlds the canon can remember.
              </motion.p>
              <motion.p
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.32, duration: 0.7 }}
                className="mt-4 max-w-xl text-[15px] leading-relaxed text-bone/60"
              >
                A protocol for shared fictional universes. A community proposes lore. GenLayer evaluates
                whether each piece fits the canon, respects the world rules, holds continuity, avoids
                duplication and adds something worth remembering. Then it settles the verdict on chain.
              </motion.p>

              <div className="mt-9 flex flex-wrap gap-3">
                <Link to="/atlas" className="cta cta-primary">
                  Enter the Atlas
                  <span className="cta-icon">
                    <ArrowUpRight size={16} />
                  </span>
                </Link>
                <Link to="/forge" className="cta cta-ghost">
                  Open the Forge
                  <span className="cta-icon">
                    <Sparkles size={15} />
                  </span>
                </Link>
                <Link to="/trial" className="cta cta-ghost">
                  View Continuity Trial
                  <span className="cta-icon">
                    <ScrollText size={15} />
                  </span>
                </Link>
                <Link to="/hall" className="cta cta-ghost">
                  Explore Artifacts
                  <span className="cta-icon">
                    <Network size={15} />
                  </span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* A PROPOSAL ENTERS THE CANON (animated preview) */}
      <section className="grid items-center gap-10 lg:grid-cols-2">
        <motion.div {...fadeUp}>
          <span className="eyebrow">A proposal enters the canon</span>
          <h2 className="myth-title mt-3 text-4xl text-bone">The Continuity Trial</h2>
          <p className="mt-4 text-[15px] leading-relaxed text-bone/65">
            Every proposal stands in the center of a ring of canon rules. The adjudicator weighs it against
            the world, validators confirm the result in layers, and the verdict forms as a living seal:
            Accepted, Rejected, Needs Revision, or Needs a Human Canon Vote.
          </p>
          <ul className="mt-6 space-y-3">
            {[
              ['Canon Fit', 'How well it sits inside the world rules.'],
              ['Continuity Risk', 'How much tension it creates with what exists.'],
              ['Originality', 'Whether it adds something genuinely new.'],
              ['Tone Match', 'Whether it speaks in the world voice.']
            ].map(([k, v]) => (
              <li key={k} className="flex items-start gap-3">
                <span className="mt-1 h-1.5 w-1.5 rounded-full" style={{ background: 'var(--rune-cyan)' }} />
                <span className="text-sm text-bone/75">
                  <span className="text-bone">{k}.</span> {v}
                </span>
              </li>
            ))}
          </ul>
          <Link to="/trial" className="cta cta-ghost mt-8">
            See a worked trial
            <span className="cta-icon">
              <ArrowUpRight size={15} />
            </span>
          </Link>
        </motion.div>

        <motion.div {...fadeUp} className="bezel">
          <div className="bezel-core flex flex-col items-center gap-6 p-10">
            {accepted ? (
              <>
                <VerdictSeal verdict="ACCEPTED" />
                <p className="text-center text-sm text-bone/60">{accepted.reason}</p>
                <div className="grid w-full grid-cols-2 gap-3 text-center">
                  {[
                    ['Canon Fit', accepted.canonFitScore, 'var(--success-mint)'],
                    ['Continuity Risk', accepted.continuityRisk, 'var(--rune-cyan)'],
                    ['Originality', accepted.originalityScore, 'var(--myth-gold)'],
                    ['Tone Match', accepted.toneMatch, 'var(--spirit-blue)']
                  ].map(([k, v, c]) => (
                    <div key={k as string} className="glass-panel p-3">
                      <p className="font-mono text-xl" style={{ color: c as string }}>
                        {v as number}
                      </p>
                      <p className="text-[10px] uppercase tracking-[0.16em] text-bone/45">{k as string}</p>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <>
                <VerdictSeal verdict="" />
                <p className="text-center text-sm text-bone/60">
                  When a proposal is judged on chain, its verdict forms here as a living seal with its four
                  real scores. Open the Continuity Trial to read the canon's rulings.
                </p>
              </>
            )}
          </div>
        </motion.div>
      </section>

      {/* WHY GENLAYER */}
      <section>
        <motion.div {...fadeUp} className="mx-auto max-w-2xl text-center">
          <span className="eyebrow">The case for consensus</span>
          <h2 className="myth-title mt-3 text-4xl text-bone">Canon you can trust together</h2>
        </motion.div>
        <div className="mt-12 grid gap-5 md:grid-cols-2">
          {WHY.map((w, i) => (
            <motion.div
              key={w.title}
              {...fadeUp}
              transition={{ ...fadeUp.transition, delay: (i % 2) * 0.08 }}
              className="bezel"
            >
              <div className="bezel-core flex gap-4 p-6">
                <span
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
                  style={{ background: 'rgba(116,235,213,0.1)', border: '1px solid var(--line-2)' }}
                >
                  <w.icon size={20} color="var(--rune-cyan)" />
                </span>
                <div>
                  <h3 className="myth-title text-lg text-bone">{w.title}</h3>
                  <p className="mt-1.5 text-[13.5px] leading-relaxed text-bone/60">{w.body}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* THE LIVING WORLD STAT STRIP */}
      <section>
        <motion.div {...fadeUp} className="bezel">
          <div className="bezel-core grid gap-6 p-8 sm:grid-cols-4">
            {[
              ['World', world.name],
              ['Canon rules', String(world.rules.length)],
              ['Accepted artifacts', String(world.artifacts.length)],
              ['Tone', world.toneTags.join(', ')]
            ].map(([k, v]) => (
              <div key={k} className="text-center sm:text-left">
                <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-rune">{k}</p>
                <p className="myth-title mt-1 text-xl text-bone">{v}</p>
              </div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* FINAL CTA */}
      <section className="relative overflow-hidden">
        <motion.div {...fadeUp} className="bezel">
          <div className="bezel-core relative px-8 py-16 text-center">
            <FloatingRune x="20%" y="30%" delay={0.4} />
            <FloatingRune x="80%" y="60%" color="var(--myth-gold)" delay={1.2} />
            <h2 className="myth-title text-4xl text-bone sm:text-5xl">Add to a world that remembers</h2>
            <p className="mx-auto mt-4 max-w-xl text-[15px] text-bone/60">
              Step into the Floating City of Aster. Propose a piece of lore and watch the canon decide.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Link to="/forge" className="cta cta-primary">
                Forge a proposal
                <span className="cta-icon">
                  <Sparkles size={15} />
                </span>
              </Link>
              <Link to="/validators" className="cta cta-ghost">
                See validator depth
                <span className="cta-icon">
                  <Eye size={15} />
                </span>
              </Link>
            </div>
          </div>
        </motion.div>
      </section>
    </div>
  )
}
