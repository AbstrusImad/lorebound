import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { Layers, ArrowUpRight } from 'lucide-react'
import { ValidatorLayer } from '../components/validators/ValidatorLayer'
import { AssetImage } from '../components/shared/AssetImage'
import { VALIDATOR_CASES } from '../data/validatorCases'

export function ValidatorChamber() {
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
                The validators do not confirm that a JSON object is well formed. They review the result in
                layers. Each layer checks something real, uses real evidence, and can correct or overrule
                the leader. Below is a worked example for each layer.
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
              <h2 className="myth-title text-lg text-bone">Six layers, one consensus</h2>
              <p className="text-[12px] text-bone/55">
                Consensus anchors on the categorical verdict plus the Canon Fit value within tolerance. The
                deterministic backstops below run in the contract, not the prompt.
              </p>
            </div>
          </div>
          <Link to="/trial" className="cta cta-ghost shrink-0">
            Watch them rule live
            <span className="cta-icon">
              <ArrowUpRight size={15} />
            </span>
          </Link>
        </div>
      </section>

      <div className="grid gap-5 lg:grid-cols-2">
        {VALIDATOR_CASES.map((c, i) => (
          <ValidatorLayer key={c.id} data={c} index={i} />
        ))}
      </div>

      <section className="bezel">
        <div className="bezel-core p-6 sm:p-8">
          <motion.h2
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="myth-title text-2xl text-bone"
          >
            The worked example, end to end
          </motion.h2>
          <p className="mt-2 max-w-3xl text-[14px] text-bone/65">
            When the leader accepted the Bridgewrights and cited a slightly imprecise rule, the Evidence
            Validator did not simply agree. It resolved the citation to the real canon text, corrected the
            wording, and only then let the seal form. A validator that merely checked the JSON shape would
            have rubber-stamped an inaccurate citation. That difference is the whole point of consensus
            here: the canon is only as trustworthy as the evidence behind each decision.
          </p>
        </div>
      </section>
    </div>
  )
}
