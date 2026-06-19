import { useRef } from 'react'
import { Download, Upload, Trash2, RotateCcw, Wallet, Cpu } from 'lucide-react'
import { useStore } from '../state/store'
import { useToast } from '../components/shared/Toast'
import { downloadWorld, parseWorldImport } from '../utils/exportImport'
import { CONTRACT_ADDRESS, IS_DEPLOYED, EXPLORER } from '../genlayer/genlayerClient'
import { shortHash } from '../utils/formatters'

export function Settings() {
  const { world, settings, setReducedMotion, setGenlayerMode, resetWorld, clearAll, importWorld, wallet, connect, disconnect } =
    useStore()
  const toast = useToast()
  const fileRef = useRef<HTMLInputElement>(null)

  const onImport = (file: File) => {
    const reader = new FileReader()
    reader.onload = () => {
      const w = parseWorldImport(String(reader.result || ''))
      if (w) {
        importWorld(w)
        toast.push('success', `Imported world: ${w.name}`)
      } else {
        toast.push('error', 'That file is not a valid Lorebound world.')
      }
    }
    reader.readAsText(file)
  }

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-3">
        <span className="eyebrow">The workshop</span>
        <h1 className="myth-title text-4xl text-bone sm:text-5xl">Settings</h1>
        <p className="max-w-2xl text-[15px] text-bone/60">
          Tune the experience, manage your local world state, and choose how Lorebound reaches GenLayer.
        </p>
      </header>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Experience */}
        <Section title="Experience">
          <Row
            title="Reduced motion"
            body="Pause the 3D canvases and heavy animation across every chamber."
          >
            <Toggle on={settings.reducedMotion} onChange={setReducedMotion} label="Reduced motion" />
          </Row>
        </Section>

        {/* GenLayer mode */}
        <Section title="GenLayer mode">
          <Row
            title="Evaluation source"
            body={
              settings.genlayerMode === 'mock'
                ? 'Mock: the deep local engine evaluates everything offline.'
                : 'Live: reads and writes the deployed Bradbury contract.'
            }
          >
            <div className="flex gap-2">
              <ModeButton active={settings.genlayerMode === 'mock'} onClick={() => setGenlayerMode('mock')} label="Mock" />
              <ModeButton
                active={settings.genlayerMode === 'real'}
                onClick={() => {
                  setGenlayerMode('real')
                  if (!IS_DEPLOYED) toast.push('info', 'No contract address wired yet. The app stays in offline behavior until deployed.')
                }}
                label="Live"
              />
            </div>
          </Row>
          <div className="glass-panel mt-3 flex items-start gap-3 p-4 text-[12px] text-bone/60">
            <Cpu size={15} color="var(--rune-cyan)" className="mt-0.5 shrink-0" />
            <div>
              <p>
                Contract address:{' '}
                <span className="font-mono text-bone/80">{shortHash(CONTRACT_ADDRESS)}</span>{' '}
                {IS_DEPLOYED ? (
                  <a className="ink-link underline" href={`${EXPLORER}/address/${CONTRACT_ADDRESS}`} target="_blank" rel="noreferrer">
                    view on explorer
                  </a>
                ) : (
                  <span className="text-bone/45">(placeholder, not deployed yet)</span>
                )}
              </p>
              <p className="mt-1 text-bone/45">The address is wired in after deployment, then the site is rebuilt.</p>
            </div>
          </div>
        </Section>

        {/* Wallet */}
        <Section title="Wallet">
          <Row title="Mock wallet" body={wallet ? `Connected as ${wallet.slice(0, 10)}...` : 'Connect a demo identity for the canon log.'}>
            {wallet ? (
              <button type="button" onClick={disconnect} className="cta cta-ghost !px-4 !py-2 text-sm">
                Disconnect
              </button>
            ) : (
              <button type="button" onClick={connect} className="cta cta-ghost !px-4 !py-2 text-sm">
                <Wallet size={15} /> Connect
              </button>
            )}
          </Row>
        </Section>

        {/* World data */}
        <Section title="World data">
          <div className="grid grid-cols-2 gap-3">
            <ActionButton icon={<Download size={15} />} label="Export world" onClick={() => { downloadWorld(world); toast.push('success', 'World exported.') }} />
            <ActionButton icon={<Upload size={15} />} label="Import world" onClick={() => fileRef.current?.click()} />
            <ActionButton icon={<RotateCcw size={15} />} label="Reset to Aster" onClick={() => { resetWorld(); toast.push('info', 'World reset to the Aster demo.') }} />
            <ActionButton
              icon={<Trash2 size={15} />}
              label="Clear local data"
              danger
              onClick={() => { clearAll(); toast.push('info', 'Local data cleared.') }}
            />
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="application/json"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0]
              if (f) onImport(f)
              e.target.value = ''
            }}
          />
        </Section>
      </div>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bezel">
      <div className="bezel-core p-6">
        <h2 className="myth-title text-xl text-bone">{title}</h2>
        <div className="mt-4">{children}</div>
      </div>
    </div>
  )
}

function Row({ title, body, children }: { title: string; body: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 py-2">
      <div>
        <p className="text-sm text-bone">{title}</p>
        <p className="text-[12px] text-bone/50">{body}</p>
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  )
}

function Toggle({ on, onChange, label }: { on: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={label}
      onClick={() => onChange(!on)}
      className="relative h-7 w-12 rounded-full transition-colors"
      style={{ background: on ? 'var(--rune-cyan)' : 'rgba(245,235,221,0.12)' }}
    >
      <span
        className="absolute top-1 h-5 w-5 rounded-full bg-void transition-transform"
        style={{ left: 4, transform: on ? 'translateX(20px)' : 'translateX(0)' }}
      />
    </button>
  )
}

function ModeButton({ active, onClick, label }: { active: boolean; onClick: () => void; label: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-full px-4 py-2 text-sm transition-colors"
      style={{
        background: active ? 'var(--myth-gold)' : 'rgba(245,235,221,0.05)',
        color: active ? '#2a1d05' : 'var(--ancient-bone)',
        border: '1px solid var(--line-2)'
      }}
    >
      {label}
    </button>
  )
}

function ActionButton({
  icon,
  label,
  onClick,
  danger
}: {
  icon: React.ReactNode
  label: string
  onClick: () => void
  danger?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="glass-panel flex items-center gap-2 p-3 text-sm transition-colors hover:border-rune"
      style={danger ? { color: 'var(--danger-ruby)' } : undefined}
    >
      {icon}
      {label}
    </button>
  )
}
