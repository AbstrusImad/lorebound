import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Hammer, Wand2, ArrowUpRight, BookOpen } from 'lucide-react'
import { AssetImage } from '../components/shared/AssetImage'
import { useStore } from '../state/store'
import { useToast } from '../components/shared/Toast'
import { DEMO_PROPOSALS } from '../data/demoProposals'
import type { LoreType, Proposal, Tone } from '../types'

const LORE_TYPES: LoreType[] = [
  'Character',
  'Location',
  'Relic',
  'Creature',
  'Faction',
  'Event',
  'Magic Rule',
  'Technology',
  'Custom'
]

const TONES: Tone[] = ['Mythic', 'Dark', 'Hopeful', 'Political', 'Mysterious', 'Technical', 'Comedic', 'Tragic']

const DRAFT_KEY = 'lorebound.forge.draft.v1'

export function LoreForge() {
  const { world } = useStore()
  const navigate = useNavigate()
  const toast = useToast()

  const [title, setTitle] = useState('')
  const [type, setType] = useState<LoreType>('Faction')
  const [text, setText] = useState('')
  const [contribution, setContribution] = useState('')
  const [tone, setTone] = useState<Tone>('Mythic')
  const [tags, setTags] = useState('')

  const canSubmit = title.trim().length > 0 && text.trim().length > 12

  const nearbyRules = useMemo(() => world.rules.slice(0, 5), [world.rules])

  const loadDemo = (id: string) => {
    const demo = DEMO_PROPOSALS.find((d) => d.proposalId === id)
    if (!demo) return
    setTitle(demo.title)
    setType(demo.type)
    setText(demo.text)
    setContribution(demo.contribution)
    setTone(demo.tone)
    setTags(demo.tags.join(', '))
    toast.push('info', `Loaded demo: ${demo.label}`)
  }

  const submit = () => {
    if (!canSubmit) {
      toast.push('error', 'Give the proposal a title and a fuller description.')
      return
    }
    const proposal: Proposal = {
      proposalId: `prop-${Date.now().toString(36)}`,
      worldId: world.worldId,
      title: title.trim(),
      type,
      text: text.trim(),
      contribution: contribution.trim(),
      tone,
      tags: tags
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean)
    }
    try {
      sessionStorage.setItem(DRAFT_KEY, JSON.stringify(proposal))
    } catch {
      /* ignore */
    }
    navigate('/trial', { state: { proposal } })
  }

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-3">
        <span className="eyebrow">The narrative forge</span>
        <h1 className="myth-title text-4xl text-bone sm:text-5xl">Lore Forge</h1>
        <p className="max-w-2xl text-[15px] text-bone/60">
          Shape a new piece of lore for {world.name}. Forge it with intent, then submit it to the
          Continuity Trial where the canon decides its fate.
        </p>
      </header>

      {/* demo seeds */}
      <div className="flex flex-wrap gap-2">
        {DEMO_PROPOSALS.map((d) => (
          <button
            key={d.proposalId}
            type="button"
            onClick={() => loadDemo(d.proposalId)}
            className="rune-chip hover:border-rune"
            title={d.blurb}
          >
            {d.label}
          </button>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        {/* forge form */}
        <div className="bezel lg:col-span-3">
          <div className="bezel-core space-y-5 p-6">
            <div>
              <label className="mb-1.5 block text-[11px] uppercase tracking-[0.18em] text-rune" htmlFor="f-title">
                Title
              </label>
              <input
                id="f-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="The Bridgewrights of Silent Glass"
                className="w-full rounded-xl border border-line2 bg-black/30 px-4 py-3 text-bone outline-none focus:border-rune"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-[11px] uppercase tracking-[0.18em] text-rune" htmlFor="f-type">
                  Type
                </label>
                <select
                  id="f-type"
                  value={type}
                  onChange={(e) => setType(e.target.value as LoreType)}
                  className="w-full rounded-xl border border-line2 bg-black/30 px-4 py-3 text-bone outline-none focus:border-rune"
                >
                  {LORE_TYPES.map((t) => (
                    <option key={t} value={t} className="bg-myth">
                      {t}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1.5 block text-[11px] uppercase tracking-[0.18em] text-rune" htmlFor="f-tone">
                  Tone
                </label>
                <select
                  id="f-tone"
                  value={tone}
                  onChange={(e) => setTone(e.target.value as Tone)}
                  className="w-full rounded-xl border border-line2 bg-black/30 px-4 py-3 text-bone outline-none focus:border-rune"
                >
                  {TONES.map((t) => (
                    <option key={t} value={t} className="bg-myth">
                      {t}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-[11px] uppercase tracking-[0.18em] text-rune" htmlFor="f-text">
                Proposal
              </label>
              <textarea
                id="f-text"
                value={text}
                onChange={(e) => setText(e.target.value)}
                rows={5}
                placeholder="Describe the piece of lore as it would exist in the world."
                className="w-full resize-none rounded-xl border border-line2 bg-black/30 px-4 py-3 text-bone outline-none focus:border-rune"
              />
              <p className="mt-1 text-right text-[11px] text-bone/40">{text.length} characters</p>
            </div>

            <div>
              <label className="mb-1.5 block text-[11px] uppercase tracking-[0.18em] text-rune" htmlFor="f-contrib">
                Intended contribution
              </label>
              <textarea
                id="f-contrib"
                value={contribution}
                onChange={(e) => setContribution(e.target.value)}
                rows={2}
                placeholder="What does this add to the world?"
                className="w-full resize-none rounded-xl border border-line2 bg-black/30 px-4 py-3 text-bone outline-none focus:border-rune"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-[11px] uppercase tracking-[0.18em] text-rune" htmlFor="f-tags">
                Tags (optional, comma separated)
              </label>
              <input
                id="f-tags"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="guild, infrastructure, silent glass"
                className="w-full rounded-xl border border-line2 bg-black/30 px-4 py-3 text-bone outline-none focus:border-rune"
              />
            </div>

            <button
              type="button"
              onClick={submit}
              disabled={!canSubmit}
              className="cta cta-primary w-full justify-center disabled:cursor-not-allowed disabled:opacity-40"
            >
              Submit to Continuity Trial
              <span className="cta-icon">
                <ArrowUpRight size={16} />
              </span>
            </button>
          </div>
        </div>

        {/* preview + guide */}
        <div className="space-y-6 lg:col-span-2">
          <motion.div layout className="bezel">
            <div className="bezel-core overflow-hidden">
              <div className="relative aspect-video">
                <AssetImage src="/assets/forge-bg.webp" alt="" className="h-full w-full object-cover opacity-70" />
                <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, transparent, rgba(7,7,19,0.85))' }} />
                <div className="absolute bottom-4 left-4 right-4">
                  <span className="rune-chip !bg-black/40">{type}</span>
                  <h3 className="myth-title mt-2 text-xl text-bone">{title || 'Untitled lore'}</h3>
                </div>
              </div>
              <div className="space-y-3 p-5">
                <div className="flex items-center gap-2 text-[12px] text-bone/55">
                  <Wand2 size={14} color="var(--rune-cyan)" />
                  <span>Tone: {tone}</span>
                </div>
                <p className="text-sm text-bone/70">{text || 'Your proposal preview will take shape here as you write.'}</p>
                {contribution ? <p className="text-[12px] text-bone/45">Adds: {contribution}</p> : null}
              </div>
            </div>
          </motion.div>

          <div className="bezel">
            <div className="bezel-core p-5">
              <div className="flex items-center gap-2">
                <BookOpen size={15} color="var(--myth-gold)" />
                <h3 className="myth-title text-lg text-bone">Nearby canon</h3>
              </div>
              <p className="mt-1 text-[12px] text-bone/50">Write with these rules in mind. Break them and the trial will catch it.</p>
              <ul className="mt-3 space-y-2">
                {nearbyRules.map((r, i) => (
                  <li key={r.id} className="flex gap-2.5 text-[13px] text-bone/70">
                    <span className="font-mono text-rune">{String(i + 1).padStart(2, '0')}</span>
                    <span>{r.text}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="glass-panel flex items-center gap-3 p-4 text-[12px] text-bone/55">
            <Hammer size={15} color="var(--rune-cyan)" />
            <span>Try the demo seeds above to see every verdict path: accepted, rejected, revision, tone, duplicate and adversarial.</span>
          </div>
        </div>
      </div>
    </div>
  )
}
