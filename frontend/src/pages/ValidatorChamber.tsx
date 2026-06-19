import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { Layers, ArrowUpRight, ShieldCheck, ShieldAlert } from 'lucide-react'
import { AssetImage } from '../components/shared/AssetImage'
import { EvidencePanel } from '../components/trial/EvidencePanel'
import { LoadingCard, ErrorCard } from '../components/shared/ChainState'
import { useStore } from '../state/store'
import type { ChainProposal, ValidatorResult } from '../types'
import { verdictLabel, verdictColor } from '../utils/formatters'

// The Validator Chamber renders the real validatorResults recorded on chain for
// each evaluated proposal. If a proposal carries no validator records, its real
// evidence and reason are shown as the layers instead. Nothing is fabricated.

export function ValidatorChamber() {
  const { world, proposals, loading, error, refresh } = useStore()

  if (loading && !world) return <LoadingCard label="Convening the Validator Chamber" />
  if (!world) return <ErrorCard message={error || 'No world is published on chain yet.'} onRetry={refresh} />

  const evaluated = proposals.filter((p) => p.verdict)

  return (
    <div className="space-y-10">
      <header className="relative">
        <div className="bezel overflow-hidden">
          <div className="bezel-core relative overflow-hidden p-8 sm:p-12">
            <AssetImage src="/assets/validator-bg.webp" alt="" className="absolute inset-0 h-full w-full object-cover opacity-40" />
            <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, rgba(7,7,19,0.5), rgba(7,7,19,0.88))' }} />
            <div className="relative max-w-2xl">
              <span className="eyebrow">Depth, not field checks</span>
              <h1 className="myth-title mt-3 text-4xl text-bone sm:text-5xl">Validator Chamber</h1>
              <p className="mt-3 text-[15px] text-bone/65">
                Each evaluated proposal carries the validator results recorded on chain. These are the real
                rulings the network reached, layer by layer, for every proposal in {world.name}.
              </p>
            </div>
          </div>
        </div>
      </header>

      <section className="bezel">
        <div className="bezel-core flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl" style={{ background: 'rgba(244,201,93,0.1)', border: '1px solid var(--line-2)' }}>
              <Layers size={20} color="var(--myth-gold)" />
            </span>
            <div>
              <h2 className="myth-title text-lg text-bone">Consensus, recorded on chain</h2>
              <p className="text-[12px] text-bone/55">
                Every ruling below is read from the contract, not generated in the browser.
              </p>
            </div>
          </div>
          <Link to="/trial" className="cta cta-ghost shrink-0">
            Watch a live trial
            <span className="cta-icon">
              <ArrowUpRight size={15} />
            </span>
          </Link>
        </div>
      </section>

      {evaluated.length === 0 ? (
        <ErrorCard message={error || 'No evaluated proposals are recorded on chain yet.'} onRetry={refresh} />
      ) : (
        <div className="space-y-8">
          {evaluated.map((p) => (
            <ProposalValidators key={p.proposalId} proposal={p} />
          ))}
        </div>
      )}
    </div>
  )
}

function ProposalValidators({ proposal }: { proposal: ChainProposal }) {
  const color = verdictColor(proposal.verdict)
  return (
    <section className="bezel">
      <div className="bezel-core p-6 sm:p-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="myth-title text-2xl text-bone">{proposal.title}</h2>
            <p className="mt-1 text-[12px] text-bone/55">{proposal.type} {'\u00b7'} {proposal.proposalId}</p>
          </div>
          <span className="rune-chip shrink-0" style={{ color, borderColor: color }}>
            {verdictLabel(proposal.verdict)}
          </span>
        </div>

        {proposal.reason ? <p className="mt-3 max-w-3xl text-[14px] text-bone/70">{proposal.reason}</p> : null}

        {proposal.validatorResults.length > 0 ? (
          <div className="mt-5 grid gap-4 lg:grid-cols-2">
            {proposal.validatorResults.map((v, i) => (
              <ValidatorRecord key={`${v.validator}-${i}`} result={v} index={i} />
            ))}
          </div>
        ) : (
          <div className="mt-5 space-y-4">
            <p className="text-[12px] text-bone/55">
              This proposal carries no separate validator records on chain. Its recorded evidence and reason
              are shown as the basis for the verdict.
            </p>
            <EvidencePanel evidence={proposal.evidence} />
          </div>
        )}
      </div>
    </section>
  )
}

function ValidatorRecord({ result, index }: { result: ValidatorResult; index: number }) {
  const ok = /accept|pass|seal|ok/i.test(result.status)
  const color = ok ? 'var(--success-mint)' : 'var(--danger-ruby)'
  const Icon = ok ? ShieldCheck : ShieldAlert
  return (
    <motion.article
      initial={{ opacity: 0, y: 20, filter: 'blur(6px)' }}
      whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ delay: (index % 2) * 0.08, duration: 0.55, ease: [0.32, 0.72, 0, 1] }}
      className="glass-panel p-5"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <span
            className="flex h-10 w-10 items-center justify-center rounded-xl"
            style={{ background: 'rgba(116,235,213,0.1)', border: '1px solid var(--line-2)' }}
          >
            <Icon size={18} color={color} />
          </span>
          <h3 className="myth-title text-lg text-bone">{result.validator}</h3>
        </div>
        <span className="rune-chip shrink-0" style={{ color, borderColor: color }}>
          {result.status}
        </span>
      </div>
      <p className="mt-3 text-sm text-bone/80">{result.reason}</p>
    </motion.article>
  )
}
