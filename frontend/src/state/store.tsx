import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode
} from 'react'
import type { CanonArtifact, EvaluationResult, Proposal, World } from '../types'
import { buildAsterWorld } from '../data/asterWorld'
import { getGenLayerMode, setGenLayerMode, connectWallet, disconnectWallet } from '../genlayer/genlayerClient'

const WORLD_KEY = 'lorebound.world.v1'
const SETTINGS_KEY = 'lorebound.settings.v1'
const TRIALS_KEY = 'lorebound.trials.v1'

interface Settings {
  reducedMotion: boolean
  genlayerMode: 'mock' | 'real'
}

interface StoreValue {
  world: World
  trials: EvaluationResult[]
  settings: Settings
  wallet: string | null
  setReducedMotion: (v: boolean) => void
  setGenlayerMode: (m: 'mock' | 'real') => void
  recordTrial: (result: EvaluationResult, proposal: Proposal) => void
  acceptArtifact: (result: EvaluationResult, proposal: Proposal) => CanonArtifact
  resetWorld: () => void
  clearAll: () => void
  importWorld: (w: World) => void
  connect: () => Promise<void>
  disconnect: () => void
}

const StoreContext = createContext<StoreValue | null>(null)

function loadWorld(): World {
  try {
    const raw = localStorage.getItem(WORLD_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as World
      if (parsed && parsed.worldId && Array.isArray(parsed.rules)) return parsed
    }
  } catch {
    /* ignore */
  }
  return buildAsterWorld()
}

function loadSettings(): Settings {
  const fallback: Settings = { reducedMotion: false, genlayerMode: 'mock' }
  try {
    const raw = localStorage.getItem(SETTINGS_KEY)
    if (raw) return { ...fallback, ...(JSON.parse(raw) as Settings) }
  } catch {
    /* ignore */
  }
  return fallback
}

function loadTrials(): EvaluationResult[] {
  try {
    const raw = localStorage.getItem(TRIALS_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed)) return parsed
    }
  } catch {
    /* ignore */
  }
  return []
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [world, setWorld] = useState<World>(loadWorld)
  const [trials, setTrials] = useState<EvaluationResult[]>(loadTrials)
  const [settings, setSettings] = useState<Settings>(loadSettings)
  const [wallet, setWallet] = useState<string | null>(null)

  // Persist.
  useEffect(() => {
    try {
      localStorage.setItem(WORLD_KEY, JSON.stringify(world))
    } catch {
      /* ignore */
    }
  }, [world])
  useEffect(() => {
    try {
      localStorage.setItem(TRIALS_KEY, JSON.stringify(trials.slice(0, 60)))
    } catch {
      /* ignore */
    }
  }, [trials])
  useEffect(() => {
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings))
    } catch {
      /* ignore */
    }
    setGenLayerMode(settings.genlayerMode)
    document.documentElement.dataset.reducedMotion = settings.reducedMotion ? 'true' : 'false'
  }, [settings])

  // Sync the genlayer mode once on mount.
  useEffect(() => {
    if (getGenLayerMode() !== settings.genlayerMode) setGenLayerMode(settings.genlayerMode)
  }, [settings.genlayerMode])

  const setReducedMotion = useCallback((v: boolean) => {
    setSettings((s) => ({ ...s, reducedMotion: v }))
  }, [])

  const setGenlayerMode = useCallback((m: 'mock' | 'real') => {
    setSettings((s) => ({ ...s, genlayerMode: m }))
  }, [])

  const recordTrial = useCallback((result: EvaluationResult) => {
    setTrials((prev) => [result, ...prev.filter((t) => t.proposalId !== result.proposalId)].slice(0, 60))
  }, [])

  const acceptArtifact = useCallback(
    (result: EvaluationResult, proposal: Proposal): CanonArtifact => {
      const id = `art-${Date.now().toString(36)}`
      // Place the new node near the center with a small deterministic offset.
      const angle = (world.artifacts.length * 137.5 * Math.PI) / 180
      const radius = 0.18 + (world.artifacts.length % 4) * 0.06
      const artifact: CanonArtifact = {
        artifactId: id,
        worldId: world.worldId,
        title: proposal.title,
        type: proposal.type,
        summary: proposal.contribution || proposal.text.slice(0, 160),
        canonFitScore: result.canonFitScore,
        proofHash: result.proofHash,
        sourceProposal: proposal.proposalId,
        accepted: wallet || 'You',
        acceptedDate: new Date().toISOString().slice(0, 10),
        x: 0.5 + Math.cos(angle) * radius,
        y: 0.5 + Math.sin(angle) * radius,
        connections: world.artifacts.slice(-2).map((a) => a.artifactId),
        image: undefined
      }
      setWorld((w) => ({ ...w, artifacts: [...w.artifacts, artifact] }))
      return artifact
    },
    [world.artifacts, world.worldId, wallet]
  )

  const resetWorld = useCallback(() => {
    setWorld(buildAsterWorld())
    setTrials([])
  }, [])

  const clearAll = useCallback(() => {
    try {
      localStorage.removeItem(WORLD_KEY)
      localStorage.removeItem(TRIALS_KEY)
    } catch {
      /* ignore */
    }
    setWorld(buildAsterWorld())
    setTrials([])
  }, [])

  const importWorld = useCallback((w: World) => {
    setWorld(w)
  }, [])

  const connect = useCallback(async () => {
    const res = await connectWallet()
    if (res.ok && res.address) setWallet(res.address)
  }, [])

  const disconnect = useCallback(() => {
    disconnectWallet()
    setWallet(null)
  }, [])

  const value = useMemo<StoreValue>(
    () => ({
      world,
      trials,
      settings,
      wallet,
      setReducedMotion,
      setGenlayerMode,
      recordTrial,
      acceptArtifact,
      resetWorld,
      clearAll,
      importWorld,
      connect,
      disconnect
    }),
    [
      world,
      trials,
      settings,
      wallet,
      setReducedMotion,
      setGenlayerMode,
      recordTrial,
      acceptArtifact,
      resetWorld,
      clearAll,
      importWorld,
      connect,
      disconnect
    ]
  )

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}

export function useStore(): StoreValue {
  const ctx = useContext(StoreContext)
  if (!ctx) throw new Error('useStore must be used within StoreProvider')
  return ctx
}

export function useReducedMotion(): boolean {
  const { settings } = useStore()
  const [system, setSystem] = useState(false)
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    setSystem(mq.matches)
    const handler = () => setSystem(mq.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])
  return settings.reducedMotion || system
}
